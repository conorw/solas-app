/**
 * Run Playwright against local `supabase start` (not a remote staging project).
 * Loads keys from `supabase status`, seeds, then runs e2e.
 */
import { spawnSync } from 'node:child_process';
import { applyLocalSupabaseEnv } from './local-supabase-env.mjs';

function run(cmd, args, env = process.env) {
	const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: true });
	if (r.status !== 0) process.exit(r.status ?? 1);
}

const env = { ...process.env };
try {
	applyLocalSupabaseEnv(env, { required: true });
} catch (err) {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
}

env.TEST_ADMIN_EMAIL = env.TEST_ADMIN_EMAIL || 'admin@example.com';
env.TEST_ADMIN_PASSWORD = env.TEST_ADMIN_PASSWORD || 'password123';
env.TEST_USER_EMAIL = env.TEST_USER_EMAIL || 'user@example.com';
env.TEST_USER_PASSWORD = env.TEST_USER_PASSWORD || 'password123';
env.TEST_ANONYMOUS_PERSON_ID = env.TEST_ANONYMOUS_PERSON_ID || '2830';
env.SEED_DIRECTORY_COUNT = env.SEED_DIRECTORY_COUNT ?? '0';

console.log(`E2E using local Supabase at ${env.PUBLIC_SUPABASE_URL}`);
run('node', ['scripts/seed-solas-dev.mjs'], env);
run('npx', ['playwright', 'test'], env);
