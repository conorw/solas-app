import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';
import { cleanupFixtures, createService, runId } from './helpers/fixtures';
import { getServiceClient } from './helpers/supabase';

loadEnv();

test.describe('admin services', () => {
	const prefix = runId();
	const serviceIds: number[] = [];
	const serviceNames: string[] = [];

	test.afterAll(async () => {
		await cleanupFixtures({ serviceIds, serviceNames });
	});

	test('list renders and search filters', async ({ page }) => {
		const svc = await createService(prefix, { Name: `${prefix}-Listed` });
		serviceIds.push(svc['Auto ID']);

		await page.goto('/admin/service');
		await expect(page.getByText(svc.Name!)).toBeVisible({ timeout: 15000 });

		await page.getByLabel('Search').fill(`${prefix}-Listed`);
		await expect(page.getByText(svc.Name!)).toBeVisible();
	});

	test('add service via dialog', async ({ page }) => {
		const name = `${prefix}-Created`;
		serviceNames.push(name);

		await page.goto('/admin/service');
		await page.getByRole('button', { name: /add new service/i }).click();
		await page.getByLabel('Name').fill(name);
		await page.getByRole('button', { name: /^save$/i }).click();
		await expect(page.locator('.service-name', { hasText: name })).toBeVisible({
			timeout: 15000
		});

		const sb = getServiceClient();
		const { data } = await sb.from('service').select('"Auto ID"').eq('Name', name).maybeSingle();
		if (data?.['Auto ID']) serviceIds.push(data['Auto ID']);
	});

	test('toggle Is Current persists after reload', async ({ page }) => {
		const svc = await createService(prefix, {
			Name: `${prefix}-Toggle`,
			'Is Current': true
		});
		serviceIds.push(svc['Auto ID']);
		const sb = getServiceClient();

		await page.goto('/admin/service');
		await page.getByLabel('Search').fill(`${prefix}-Toggle`);
		const row = page.locator('tr', { hasText: `${prefix}-Toggle` });
		await expect(row).toBeVisible({ timeout: 15000 });
		const checkbox = row.locator('input[type="checkbox"]').first();
		await expect(checkbox).toBeChecked();
		await checkbox.click({ force: true });

		await expect
			.poll(
				async () => {
					const { data } = await sb
						.from('service')
						.select('"Is Current"')
						.eq('Auto ID', svc['Auto ID'])
						.single();
					return data?.['Is Current'];
				},
				{ timeout: 15000 }
			)
			.toBe(false);

		await page.reload();
		await page.getByLabel('Search').fill(`${prefix}-Toggle`);
		await expect(row.locator('input[type="checkbox"]').first()).not.toBeChecked({
			timeout: 15000
		});
	});
});
