/**
 * Capture screenshots of key screens for the director change summary.
 * Uses local branch UI; document URLs point at production.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'director-update', 'screenshots');

function loadEnv() {
	const envPath = path.join(root, '.env');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const m = line.match(/^([^#=]+)=(.*)$/);
		if (!m) continue;
		const key = m[1].trim();
		let val = m[2].trim().replace(/^["']|["']$/g, '');
		if (!(key in process.env)) process.env[key] = val;
	}
}

loadEnv();

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

if (!email || !password) {
	console.error('Missing TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD');
	process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

async function shot(page, name, fullPage = true) {
	const file = path.join(outDir, `${name}.png`);
	await page.waitForTimeout(600);
	await page.screenshot({ path: file, fullPage });
	console.log('saved', file);
}

async function login(page) {
	await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
	const inputs = page.locator('input');
	await inputs.nth(0).fill(email);
	await inputs.nth(1).fill(password);
	await page.getByRole('button', { name: /login/i }).click();
	await page.waitForURL(/attendance|admin|people/, { timeout: 20000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 1
});
const page = await context.newPage();

try {
	await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
	await shot(page, '01-login', false);

	await login(page);
	await page.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });
	await shot(page, '02-attendance');

	await page.goto(`${BASE}/people`, { waitUntil: 'networkidle' });
	await shot(page, '03-people');

	// Open first person if available
	const personLink = page.locator('a[href*="/people/"]').first();
	if (await personLink.count()) {
		await personLink.click();
		await page.waitForLoadState('networkidle');
		await shot(page, '04-person-form');
	}

	await page.goto(`${BASE}/admin/stats`, { waitUntil: 'networkidle' });
	await shot(page, '05-stats');

	await page.goto(`${BASE}/admin/service`, { waitUntil: 'networkidle' });
	await shot(page, '06-services');

	await page.goto(`${BASE}/admin/people/merge`, { waitUntil: 'networkidle' });
	await shot(page, '07-merge-people');

	// Admin menu open on attendance
	await page.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });
	const adminBtn = page.getByRole('button', { name: /admin/i });
	if (await adminBtn.count()) {
		await adminBtn.click();
		await page.waitForTimeout(400);
		await shot(page, '08-admin-menu', false);
	}
} catch (err) {
	console.error(err);
	process.exitCode = 1;
} finally {
	await browser.close();
}
