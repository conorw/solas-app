/**
 * Run Playwright against a local `supabase start` stack.
 * Loads keys from `supabase status`, sets fixed test users, seeds, then runs e2e.
 */
import { spawnSync } from 'node:child_process';

function run(cmd, args, env = process.env) {
	const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: true });
	if (r.status !== 0) process.exit(r.status ?? 1);
}

const status = spawnSync('npx', ['supabase', 'status', '-o', 'env'], {
	encoding: 'utf8',
	shell: true
});
if (status.status !== 0) {
	console.error(status.stderr || 'supabase status failed — run npm run supabase:start first');
	process.exit(status.status ?? 1);
}

const mapped = spawnSync('node', ['scripts/export-local-supabase-env.mjs'], {
	input: status.stdout,
	encoding: 'utf8',
	shell: true
});
if (mapped.status !== 0) {
	console.error(mapped.stderr);
	process.exit(mapped.status ?? 1);
}

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

const env = { ...process.env };
for (const line of mapped.stdout.split(/\r?\n/)) {
	if (!line.includes('=')) continue;
	const i = line.indexOf('=');
	env[line.slice(0, i).trim()] = unquote(line.slice(i + 1));
}

env.TEST_ADMIN_EMAIL = env.TEST_ADMIN_EMAIL || 'admin@example.com';
env.TEST_ADMIN_PASSWORD = env.TEST_ADMIN_PASSWORD || 'password123';
env.TEST_USER_EMAIL = env.TEST_USER_EMAIL || 'user@example.com';
env.TEST_USER_PASSWORD = env.TEST_USER_PASSWORD || 'password123';
env.TEST_ANONYMOUS_PERSON_ID = env.TEST_ANONYMOUS_PERSON_ID || '2830';
env.SEED_DIRECTORY_COUNT = env.SEED_DIRECTORY_COUNT ?? '0';

run('node', ['scripts/seed-solas-dev.mjs'], env);
run('npx', ['playwright', 'test'], env);
