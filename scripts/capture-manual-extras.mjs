import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs', 'user-manual', 'screenshots');

function loadEnv() {
	const envPath = path.join(root, '.env');
	for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const m = line.match(/^([^#=]+)=(.*)$/);
		if (!m) continue;
		const key = m[1].trim();
		let val = m[2].trim().replace(/^["']|["']$/g, '');
		if (!(key in process.env)) process.env[key] = val;
	}
}
loadEnv();

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
	await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
	await page.locator('input').nth(0).fill(process.env.TEST_ADMIN_EMAIL);
	await page.locator('input').nth(1).fill(process.env.TEST_ADMIN_PASSWORD);
	await page.getByRole('button', { name: /login/i }).click();
	await page.waitForURL(/attendance/, { timeout: 25000 });

	await page.goto(`${BASE}/admin/stats`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1000);
	const pdf = page.getByRole('button', { name: /export pdf/i });
	if (await pdf.isEnabled()) {
		await pdf.click();
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(outDir, '05b-pdf-sections.png') });
		console.log('saved 05b');
		await page.keyboard.press('Escape');
	}

	await page.goto(`${BASE}/admin/service`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(800);
	await page.screenshot({ path: path.join(outDir, '06-services.png'), fullPage: true });
	const add = page.getByRole('button', { name: /add service/i });
	if (await add.count()) {
		await add.click();
		await page.waitForTimeout(500);
		await page.screenshot({ path: path.join(outDir, '06b-add-service.png') });
		console.log('saved 06b');
	}
	console.log('ok');
} catch (e) {
	console.error(e);
	process.exitCode = 1;
} finally {
	await browser.close();
}
