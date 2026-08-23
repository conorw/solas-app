import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from './tests/helpers/env';

loadEnv();

const config = defineConfig({
	testDir: 'tests',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? 'github' : 'list',
	timeout: 60_000,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
		trace: 'on-first-retry',
		...devices['Desktop Chrome']
	},
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	projects: [
		{ name: 'setup', testMatch: /.*\.setup\.ts/ },
		{
			name: 'unauthenticated',
			testMatch: /auth\.spec\.ts/,
			use: { storageState: { cookies: [], origins: [] } }
		},
		{
			name: 'user',
			testMatch: /\/(attendance|people)\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: 'tests/.auth/user.json' }
		},
		{
			name: 'admin',
			testMatch: /admin-.*\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: 'tests/.auth/admin.json' }
		},
		{
			name: 'auth-logged-in',
			testMatch: /auth-session\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: 'tests/.auth/user.json' }
		}
	]
});

export default config;
