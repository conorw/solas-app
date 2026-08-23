import { test, expect } from '@playwright/test';
import { loadEnv, requireEnv } from './helpers/env';
import { fillLogin } from './helpers/auth';

loadEnv();

test.describe('unauthenticated redirects', () => {
	test('home redirects to login', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/login/);
	});

	test('attendance redirects to login', async ({ page }) => {
		await page.goto('/attendance');
		await expect(page).toHaveURL(/login/);
	});

	test('people redirects to login', async ({ page }) => {
		await page.goto('/people');
		await expect(page).toHaveURL(/login/);
	});

	test('admin routes redirect to login', async ({ page }) => {
		await page.goto('/admin/service');
		await expect(page).toHaveURL(/login/);
	});
});

test.describe('login form', () => {
	test('rejects invalid credentials', async ({ page }) => {
		await fillLogin(page, requireEnv('TEST_USER_EMAIL'), 'wrong-password-xyz');
		await expect(page).toHaveURL(/login/, { timeout: 10000 });
	});

	test('accepts valid credentials and lands on attendance', async ({ page }) => {
		await fillLogin(page, requireEnv('TEST_USER_EMAIL'), requireEnv('TEST_USER_PASSWORD'));
		await expect(page).toHaveURL(/attendance/, { timeout: 20000 });
		await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
		await expect(page.getByLabel('People')).toBeVisible();
	});
});
