/**
 * Dump production Postgres (roles, schema, data) to a dated local folder,
 * upload a tarball to the private db-backups Storage bucket, then keep
 * at most MAX_BACKUPS copies in Storage and in local backups/.
 *
 * Usage: npm run backup:prod
 *
 * Local / CI: PROD_SUPABASE_URL, PROD_SUPABASE_SERVICE_ROLE_KEY, PROD_SUPABASE_DB_URL
 * (service role and DB URL may fall back to SUPABASE_SERVICE_ROLE_KEY / SUPABASE_DB_URL)
 *
 * Requires Docker (pg_dump runs in the official Supabase Postgres image).
 * Direct db.<ref>.supabase.co hosts are rewritten to the session pooler
 * (IPv4) because the direct host is IPv6-only.
 */
import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUCKET = 'db-backups';
const MAX_BACKUPS = 12;
const DUMP_FILES = ['roles.sql', 'schema.sql', 'data.sql'];

function loadEnv() {
	const path = resolve(ROOT, '.env');
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
		const t = line.trim();
		if (!t || t.startsWith('#') || !t.includes('=')) continue;
		const i = t.indexOf('=');
		const key = t.slice(0, i).trim();
		let value = t.slice(i + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (process.env[key] === undefined) process.env[key] = value;
	}
}

loadEnv();

const url = process.env.PROD_SUPABASE_URL;
const key = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.PROD_SUPABASE_DB_URL || process.env.SUPABASE_DB_URL;

function projectRefFromSupabaseUrl(supabaseUrl) {
	try {
		const host = new URL(supabaseUrl).hostname;
		const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
		if (match) return match[1];
	} catch {
		/* invalid URL */
	}
	return null;
}

if (!url) {
	console.error('Missing PROD_SUPABASE_URL (do not use PUBLIC_SUPABASE_URL; that is often the dev project)');
	process.exit(1);
}
const projectRef = projectRefFromSupabaseUrl(url);
if (!projectRef) {
	console.error('PROD_SUPABASE_URL must be https://<project-ref>.supabase.co');
	process.exit(1);
}
if (!key) {
	console.error('Missing PROD_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}
if (!dbUrl) {
	console.error(
		'Missing PROD_SUPABASE_DB_URL or SUPABASE_DB_URL (session pooler connection string, port 5432)'
	);
	process.exit(1);
}
if (dbUrl.includes(':6543')) {
	console.error('Use the session pooler on port 5432, not the transaction pooler on 6543');
	process.exit(1);
}
if (!/^postgres(ql)?:\/\//i.test(dbUrl)) {
	console.error(
		'SUPABASE_DB_URL / PROD_SUPABASE_DB_URL must be a Postgres URI starting with postgresql:// (Dashboard → Connect → Session pooler, port 5432). A Storage or https:// URL will not work.'
	);
	process.exit(1);
}

/** Direct db.<ref>.supabase.co is IPv6-only and refused from Docker/GitHub runners. */
const POOLER_REGION = process.env.SUPABASE_POOLER_REGION || 'eu-west-1';

function dumpConnection(raw) {
	const stripped = raw.replace(/^postgres(?:ql)?:\/\//i, '');
	const at = stripped.lastIndexOf('@');
	if (at < 0) throw new Error('Invalid Postgres connection string');
	const userinfo = stripped.slice(0, at);
	const hostport = stripped.slice(at + 1).split('/')[0];
	const colon = userinfo.indexOf(':');
	if (colon < 0) throw new Error('Database URL is missing a password');
	const userPart = decodeURIComponent(userinfo.slice(0, colon));
	const password = decodeURIComponent(userinfo.slice(colon + 1));
	if (!password) throw new Error('Database URL is missing a password');
	const [hostname, portPart] = hostport.split(':');
	const direct = hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
	let user = userPart;
	let host = hostname;
	let port = portPart || '5432';
	if (direct) {
		const ref = direct[1];
		user = `postgres.${ref}`;
		host = `aws-0-${POOLER_REGION}.pooler.supabase.com`;
		port = '5432';
		console.log(`using session pooler ${host}:${port} (direct db host is IPv6-only)`);
	} else if (host.includes('pooler.supabase.com') && user === 'postgres') {
		user = `postgres.${projectRef}`;
	}
	return { password, user, host, port };
}

const { password: dumpPassword, user: dumpUser, host: dumpHost, port: dumpPort } =
	dumpConnection(dbUrl);

const stamp = new Date()
	.toISOString()
	.replaceAll(':', '-')
	.replace(/\.\d{3}Z$/, 'Z');
const backupsRoot = join(ROOT, 'backups');
const stampDir = join(backupsRoot, stamp);
const tarName = `${stamp}.tar.gz`;
const tarPath = join(backupsRoot, tarName);

function run(command, args, opts = {}) {
	const { env: extraEnv, ...rest } = opts;
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: false,
		windowsHide: true,
		env: { ...process.env, ...extraEnv },
		...rest
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		const shown = args.map((a) =>
			a === dumpPassword || a.includes(dumpPassword) ? '[redacted]' : a
		);
		throw new Error(`${command} ${shown.join(' ')} failed with exit ${result.status}`);
	}
}

function dockerPg(pgArgs) {
	const image = process.env.SUPABASE_PG_IMAGE || 'public.ecr.aws/supabase/postgres:17.6.1.165';
	const envFile = join(backupsRoot, '.pg.env');
	writeFileSync(envFile, `PGPASSWORD=${dumpPassword}\n`);
	try {
		run('docker', [
			'run',
			'--rm',
			'--env-file',
			envFile,
			'-v',
			`${stampDir}:/out`,
			image,
			...pgArgs
		]);
	} finally {
		rmSync(envFile, { force: true });
	}
}

function dbDumpRoles() {
	dockerPg([
		'pg_dumpall',
		'--roles-only',
		'--no-password',
		'--host',
		dumpHost,
		'--port',
		dumpPort,
		'--username',
		dumpUser,
		'-f',
		'/out/roles.sql'
	]);
}

function dbDumpSchema() {
	dockerPg([
		'pg_dump',
		'--no-password',
		'--host',
		dumpHost,
		'--port',
		dumpPort,
		'--username',
		dumpUser,
		'--dbname',
		'postgres',
		'--schema-only',
		'-f',
		'/out/schema.sql'
	]);
}

function dbDumpData() {
	dockerPg([
		'pg_dump',
		'--no-password',
		'--host',
		dumpHost,
		'--port',
		dumpPort,
		'--username',
		dumpUser,
		'--dbname',
		'postgres',
		'--data-only',
		'--exclude-table=storage.buckets_vectors',
		'--exclude-table=storage.vector_indexes',
		'-f',
		'/out/data.sql'
	]);
}

function packTarball() {
	const relDir = join('backups', stamp).replaceAll('\\', '/');
	const relTar = join('backups', tarName).replaceAll('\\', '/');
	run('tar', ['--force-local', '-czf', relTar, '-C', relDir, ...DUMP_FILES], { cwd: ROOT });
	if (!existsSync(tarPath)) {
		throw new Error(`tar did not create ${tarPath}`);
	}
}

function pruneLocal() {
	if (!existsSync(backupsRoot)) return;
	const stamps = readdirSync(backupsRoot)
		.filter((name) => {
			const full = join(backupsRoot, name);
			return statSync(full).isDirectory() && existsSync(join(full, 'data.sql'));
		})
		.sort();
	const extra = stamps.slice(0, Math.max(0, stamps.length - MAX_BACKUPS));
	for (const old of extra) {
		rmSync(join(backupsRoot, old), { recursive: true, force: true });
		rmSync(join(backupsRoot, `${old}.tar.gz`), { force: true });
		console.log('pruned local backup', old);
	}
}

async function ensureBucket(sb) {
	const listed = await sb.storage.listBuckets();
	if (listed.error) throw listed.error;
	if (listed.data?.some((b) => b.id === BUCKET || b.name === BUCKET)) return;
	const created = await sb.storage.createBucket(BUCKET, {
		public: false,
		fileSizeLimit: 50 * 1024 * 1024
	});
	if (created.error) throw created.error;
	console.log('created bucket', BUCKET);
}

async function pruneStorage(sb) {
	const listed = await sb.storage.from(BUCKET).list('', {
		limit: 100,
		sortBy: { column: 'name', order: 'asc' }
	});
	if (listed.error) throw listed.error;
	const objects = (listed.data ?? [])
		.map((row) => row.name)
		.filter((name) => name.endsWith('.tar.gz'))
		.sort();
	const extra = objects.slice(0, Math.max(0, objects.length - MAX_BACKUPS));
	if (!extra.length) return;
	const removed = await sb.storage.from(BUCKET).remove(extra);
	if (removed.error) throw removed.error;
	for (const name of extra) console.log('pruned storage backup', name);
}

async function main() {
	mkdirSync(stampDir, { recursive: true });
	console.log('dumping production to', stampDir);

	dbDumpSchema();
	dbDumpData();
	try {
		dbDumpRoles();
	} catch (err) {
		console.warn('roles dump skipped (optional on hosted Postgres):', err.message);
		writeFileSync(join(stampDir, 'roles.sql'), '-- roles dump skipped\n');
	}

	for (const name of DUMP_FILES) {
		const path = join(stampDir, name);
		if (!existsSync(path) || statSync(path).size === 0) {
			throw new Error(`dump missing or empty: ${name}`);
		}
	}

	packTarball();
	console.log('packed', tarName, `(${statSync(tarPath).size} bytes)`);

	const sb = createClient(url, key, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
	await ensureBucket(sb);

	const body = readFileSync(tarPath);
	const uploaded = await sb.storage.from(BUCKET).upload(tarName, body, {
		contentType: 'application/gzip',
		upsert: false
	});
	if (uploaded.error) throw uploaded.error;
	console.log('uploaded', `${BUCKET}/${tarName}`);

	await pruneStorage(sb);
	pruneLocal();
	console.log('done; kept at most', MAX_BACKUPS, 'backups');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
