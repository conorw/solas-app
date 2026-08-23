import type { APIRequestContext, Page, BrowserContext } from '@playwright/test';
import { requireEnv } from './env';

/** Login via SvelteKit form action (same endpoint as the login page). */
export async function loginViaForm(
	request: APIRequestContext,
	email: string,
	password: string
): Promise<{ ok: boolean; status: number; body: string }> {
	const form = new URLSearchParams();
	form.set('email', email);
	form.set('password', password);

	const res = await request.post('/login?/login', {
		form: { email, password },
		maxRedirects: 0
	});
	const body = await res.text();
	return { ok: res.ok() || res.status() === 303 || res.status() === 200, status: res.status(), body };
}

export async function loginAsUser(page: Page) {
	await page.goto('/login');
	await page.locator('input[name="email"], input').first().fill(requireEnv('TEST_USER_EMAIL'));
	await page.locator('input[name="password"], input[type="password"]').fill(requireEnv('TEST_USER_PASSWORD'));
	await page.getByRole('button', { name: /login/i }).click();
	await page.waitForURL(/\/(attendance)?/, { timeout: 15000 });
}

export async function loginAsAdmin(page: Page) {
	await page.goto('/login');
	await page.locator('input').nth(0).fill(requireEnv('TEST_ADMIN_EMAIL'));
	await page.locator('input[type="password"], input').nth(1).fill(requireEnv('TEST_ADMIN_PASSWORD'));
	await page.getByRole('button', { name: /login/i }).click();
	await page.waitForURL(/attendance/, { timeout: 15000 });
}

/** Fill login form fields more reliably against SMUI textfields. */
export async function fillLogin(page: Page, email: string, password: string) {
	await page.goto('/login');
	const inputs = page.locator('input');
	await inputs.nth(0).fill(email);
	await inputs.nth(1).fill(password);
	await page.getByRole('button', { name: /login/i }).click();
}

export async function saveStorageState(context: BrowserContext, path: string) {
	await context.storageState({ path });
}
