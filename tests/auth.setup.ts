import { test as setup, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { loadEnv, requireEnv } from './helpers/env';

loadEnv();

setup('authenticate as user', async ({ page }) => {
	mkdirSync('tests/.auth', { recursive: true });
	await page.goto('/login');
	await page.locator('input').nth(0).fill(requireEnv('TEST_USER_EMAIL'));
	await page.locator('input').nth(1).fill(requireEnv('TEST_USER_PASSWORD'));
	await page.getByRole('button', { name: /login/i }).click();
	await expect(page).toHaveURL(/attendance/, { timeout: 20000 });
	await page.context().storageState({ path: 'tests/.auth/user.json' });
});

setup('authenticate as admin', async ({ page }) => {
	mkdirSync('tests/.auth', { recursive: true });
	await page.goto('/login');
	await page.locator('input').nth(0).fill(requireEnv('TEST_ADMIN_EMAIL'));
	await page.locator('input').nth(1).fill(requireEnv('TEST_ADMIN_PASSWORD'));
	await page.getByRole('button', { name: /login/i }).click();
	await expect(page).toHaveURL(/attendance/, { timeout: 20000 });
	await page.context().storageState({ path: 'tests/.auth/admin.json' });
});
