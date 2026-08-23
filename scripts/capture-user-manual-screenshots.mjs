/**
 * Extra screenshots for the end-user manual.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'user-manual', 'screenshots');

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
fs.mkdirSync(outDir, { recursive: true });

// Reuse director screenshots where useful
const directorShots = path.join(root, 'docs', 'director-update', 'screenshots');
for (const f of fs.readdirSync(directorShots)) {
	fs.copyFileSync(path.join(directorShots, f), path.join(outDir, f));
}

async function shot(page, name, fullPage = true) {
	const file = path.join(outDir, `${name}.png`);
	await page.waitForTimeout(500);
	await page.screenshot({ path: file, fullPage });
	console.log('saved', name);
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
	// Login + forgot password mode
	await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
	await shot(page, '01-login', false);
	const forgot = page.getByRole('button', { name: /forgot|reset/i }).or(
		page.locator('text=/forgot|reset password/i')
	);
	if (await forgot.count()) {
		await forgot.first().click();
		await page.waitForTimeout(400);
		await shot(page, '01b-forgot-password', false);
	}

	await login(page);

	await page.goto(`${BASE}/attendance`, { waitUntil: 'networkidle' });
	await shot(page, '02-attendance');

	// Multi-event dialog
	const multiBtn = page.getByRole('button', { name: /multi event/i });
	if (await multiBtn.count()) {
		await multiBtn.click();
		await page.waitForTimeout(500);
		await shot(page, '02b-multi-event-dialog', false);
		await page.keyboard.press('Escape');
	}

	await page.goto(`${BASE}/people`, { waitUntil: 'networkidle' });
	await shot(page, '03-people');

	await page.goto(`${BASE}/people/new`, { waitUntil: 'networkidle' });
	await shot(page, '04a-add-person');

	const personLink = page.locator('a[href*="/people/"]').first();
	await page.goto(`${BASE}/people`, { waitUntil: 'networkidle' });
	const editBtn = page.getByRole('link', { name: /edit/i }).first();
	if (await editBtn.count()) {
		await editBtn.click();
		await page.waitForLoadState('networkidle');
		await shot(page, '04-person-form');
	} else if (await personLink.count()) {
		await personLink.click();
		await page.waitForLoadState('networkidle');
		await shot(page, '04-person-form');
	}

	// Person history (admin)
	const historyBtn = page.getByRole('link', { name: /history/i }).first();
	await page.goto(`${BASE}/people`, { waitUntil: 'networkidle' });
	if (await historyBtn.count()) {
		await historyBtn.click();
		await page.waitForLoadState('networkidle');
		await shot(page, '04b-person-history');
	}

	await page.goto(`${BASE}/admin/stats`, { waitUntil: 'networkidle' });
	await shot(page, '05-stats');

	const pdfBtn = page.getByRole('button', { name: /export pdf/i });
	if (await pdfBtn.count() && (await pdfBtn.isEnabled())) {
		await pdfBtn.click();
		await page.waitForTimeout(500);
		await shot(page, '05b-pdf-sections', false);
		await page.keyboard.press('Escape');
	}

	await page.goto(`${BASE}/admin/service`, { waitUntil: 'networkidle' });
	await shot(page, '06-services');
	const addService = page.getByRole('button', { name: /add service/i });
	if (await addService.count()) {
		await addService.click();
		await page.waitForTimeout(400);
		await shot(page, '06b-add-service', false);
		await page.keyboard.press('Escape');
	}

	await page.goto(`${BASE}/admin/people/merge`, { waitUntil: 'networkidle' });
	await shot(page, '07-merge-people');

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
