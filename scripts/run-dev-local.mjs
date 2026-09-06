/**
 * Start the Vite dev server with env forced to local `supabase start`.
 * Ignores remote PUBLIC_SUPABASE_* values in `.env` so local work never hits staging.
 */
import { spawn } from 'node:child_process';
import { applyLocalSupabaseEnv } from './local-supabase-env.mjs';

const env = { ...process.env };
try {
	const local = applyLocalSupabaseEnv(env, { required: true });
	console.log(`Dev server using local Supabase at ${local.PUBLIC_SUPABASE_URL}`);
} catch (err) {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
}

const child = spawn('npx', ['vite', 'dev', ...process.argv.slice(2)], {
	env,
	stdio: 'inherit',
	shell: true
});

child.on('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 1);
});
