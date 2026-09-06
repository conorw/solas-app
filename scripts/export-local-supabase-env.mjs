/**
 * Map `supabase status -o env` into app env vars and print GitHub Actions
 * `GITHUB_ENV` lines (or shell exports with --shell).
 *
 * Usage:
 *   npx supabase status -o env > /tmp/sb.env
 *   node scripts/export-local-supabase-env.mjs < /tmp/sb.env >> $GITHUB_ENV
 *
 * Or:
 *   eval "$(npx supabase status -o env | node scripts/export-local-supabase-env.mjs --shell)"
 */
import { readFileSync } from 'node:fs';

const asShell = process.argv.includes('--shell');
const raw = readFileSync(0, 'utf8');
function unquote(value) {
	const v = value.trim();
	if (
		(v.startsWith('"') && v.endsWith('"')) ||
		(v.startsWith("'") && v.endsWith("'"))
	) {
		return v.slice(1, -1);
	}
	return v;
}

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

if (!apiUrl || !anon || !service) {
	console.error('Expected API_URL, ANON_KEY, SERVICE_ROLE_KEY from supabase status -o env');
	process.exit(1);
}

const lines = [
	['PUBLIC_SUPABASE_URL', apiUrl],
	['PUBLIC_SUPABASE_ANON_KEY', anon],
	['SUPABASE_SERVICE_ROLE_KEY', service]
];

for (const [k, v] of lines) {
	if (asShell) {
		console.log(`export ${k}=${JSON.stringify(v)}`);
	} else {
		console.log(`${k}=${v}`);
	}
}
