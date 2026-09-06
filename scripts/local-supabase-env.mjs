/**
 * Resolve env vars from a running local `supabase start` stack.
 *
 * CLI:
 *   node scripts/local-supabase-env.mjs           # KEY=value lines
 *   node scripts/local-supabase-env.mjs --write    # merge into .env
 *
 * Import:
 *   import { getLocalSupabaseEnv, applyLocalSupabaseEnv } from './local-supabase-env.mjs';
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ENV_KEYS = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

function unquote(value) {
	const v = value.trim();
	if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
		return v.slice(1, -1);
	}
	return v;
}

function parseStatusEnv(raw) {
	const map = Object.fromEntries(
		raw
			.split(/\r?\n/)
			.filter((l) => l.includes('='))
			.map((l) => {
				const i = l.indexOf('=');
				return [l.slice(0, i).trim(), unquote(l.slice(i + 1))];
			})
	);
	const apiUrl = map.API_URL || map.SUPABASE_URL;
	const anon = map.ANON_KEY || map.SUPABASE_ANON_KEY;
	const service = map.SERVICE_ROLE_KEY || map.SUPABASE_SERVICE_ROLE_KEY;
	if (!apiUrl || !anon || !service) return null;
	return {
		PUBLIC_SUPABASE_URL: apiUrl,
		PUBLIC_SUPABASE_ANON_KEY: anon,
		SUPABASE_SERVICE_ROLE_KEY: service
	};
}

/** @returns {Record<string, string> | null} */
export function getLocalSupabaseEnv() {
	const status = spawnSync('npx', ['supabase', 'status', '-o', 'env'], {
		encoding: 'utf8',
		shell: true
	});
	if (status.status !== 0) return null;
	return parseStatusEnv(status.stdout || '');
}

/** Apply local keys onto `target` (default process.env). Throws if stack is down. */
export function applyLocalSupabaseEnv(target = process.env, { required = true } = {}) {
	const local = getLocalSupabaseEnv();
	if (!local) {
		if (required) {
			throw new Error(
				'Local Supabase is not running. Start it with: npm run supabase:start'
			);
		}
		return null;
	}
	Object.assign(target, local);
	return local;
}

export function isLocalSupabaseUrl(url) {
	if (!url) return false;
	try {
		const host = new URL(url).hostname.toLowerCase();
		return host === '127.0.0.1' || host === 'localhost';
	} catch {
		return false;
	}
}

/** Merge local Supabase keys into `.env` (creates file if missing). */
export function writeLocalSupabaseEnvToDotenv(dotenvPath = resolve(process.cwd(), '.env')) {
	const local = applyLocalSupabaseEnv({}, { required: true });
	const existing = existsSync(dotenvPath) ? readFileSync(dotenvPath, 'utf8') : '';
	const lines = existing ? existing.split(/\r?\n/) : [];
	const seen = new Set();

	const next = lines.map((line) => {
		const t = line.trim();
		if (!t || t.startsWith('#') || !t.includes('=')) return line;
		const i = t.indexOf('=');
		const key = t.slice(0, i).trim();
		if (!ENV_KEYS.includes(key)) return line;
		seen.add(key);
		return `${key}=${local[key]}`;
	});

	for (const key of ENV_KEYS) {
		if (!seen.has(key)) next.push(`${key}=${local[key]}`);
	}

	const body = next.join('\n').replace(/\n*$/, '\n');
	writeFileSync(dotenvPath, body, 'utf8');
	return local;
}

const isMain =
	Boolean(process.argv[1]) &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
	try {
		if (process.argv.includes('--write')) {
			const local = writeLocalSupabaseEnvToDotenv();
			console.log(`Wrote local Supabase keys to .env (${local.PUBLIC_SUPABASE_URL})`);
		} else {
			const local = applyLocalSupabaseEnv({}, { required: true });
			for (const key of ENV_KEYS) console.log(`${key}=${local[key]}`);
		}
	} catch (err) {
		console.error(err instanceof Error ? err.message : err);
		process.exit(1);
	}
}
