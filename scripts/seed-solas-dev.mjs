/**
 * Seed solas_dev with TEST_ADMIN / TEST_USER auth accounts, profiles, and
 * the anonymous bulk-attendance person (default Auto ID 2830).
 *
 * Usage: node scripts/seed-solas-dev.mjs
 * Requires .env: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * TEST_ADMIN_EMAIL/PASSWORD, TEST_USER_EMAIL/PASSWORD
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
	const path = resolve(process.cwd(), '.env');
	if (!existsSync(path)) throw new Error('.env not found');
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

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url?.includes('dioxdgkkxprgvaxarxcj')) {
	console.error('Refusing to seed: PUBLIC_SUPABASE_URL is not solas_dev');
	process.exit(1);
}
if (!key) {
	console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPass = process.env.TEST_ADMIN_PASSWORD;
const userEmail = process.env.TEST_USER_EMAIL;
const userPass = process.env.TEST_USER_PASSWORD;
const anonId = Number(process.env.TEST_ANONYMOUS_PERSON_ID || 2830);

const sb = createClient(url, key, {
	auth: { autoRefreshToken: false, persistSession: false }
});

async function ensureUser(email, password, isAdmin) {
	const list = await sb.auth.admin.listUsers({ perPage: 1000 });
	if (list.error) throw list.error;
	let user = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
	if (!user) {
		const created = await sb.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});
		if (created.error) throw created.error;
		user = created.data.user;
		console.log('created user', email);
	} else {
		const upd = await sb.auth.admin.updateUserById(user.id, {
			password,
			email_confirm: true
		});
		if (upd.error) throw upd.error;
		console.log('updated user', email);
	}
	const { error } = await sb.from('profiles').upsert({
		id: user.id,
		full_name: email,
		isAdmin: isAdmin ? 'true' : null
	});
	if (error) throw error;
	console.log('profile ok', email, 'isAdmin=', isAdmin);
}

await ensureUser(adminEmail, adminPass, true);
await ensureUser(userEmail, userPass, false);

const { data: existing, error: lookupErr } = await sb
	.from('people')
	.select('"Auto ID"')
	.eq('Auto ID', anonId)
	.maybeSingle();
if (lookupErr) throw lookupErr;

if (!existing) {
	const { error } = await sb.from('people').insert({
		'Auto ID': anonId,
		FirstName: 'Anonymous',
		LastName: 'Attendee',
		DateOfBirth: '1970-01-01'
	});
	if (error) throw error;
	console.log('created anonymous person', anonId);
} else {
	console.log('anonymous person exists', anonId);
}

console.log('seed ok');
