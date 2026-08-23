import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';

loadEnv();

test.describe('authenticated session', () => {
	test('root redirects to attendance', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/attendance/);
	});

	test('non-admin cannot access admin routes', async ({ page }) => {
		await page.goto('/admin/service');
		await expect(page).toHaveURL(/attendance/);
		await page.goto('/admin/stats');
		await expect(page).toHaveURL(/attendance/);
		await page.goto('/admin/people/merge');
		await expect(page).toHaveURL(/attendance/);
	});

	test('logout clears session', async ({ page }) => {
		await page.goto('/attendance');
		await expect(page).toHaveURL(/attendance/);
		await page.getByRole('button', { name: /logout/i }).click();
		// Client-side signOut; wait for auth cookies to clear then verify redirect
		await page.waitForTimeout(1000);
		await page.goto('/attendance');
		await expect(page).toHaveURL(/login/, { timeout: 15000 });
	});
});
