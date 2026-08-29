import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';
import { cleanupFixtures, createService, runId } from './helpers/fixtures';
import { getServiceClient } from './helpers/supabase';
import { fillTextField, setCheckbox } from './helpers/smui';

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
		await expect(page.getByTestId('service-page')).toHaveAttribute('data-ready', 'true', {
			timeout: 15000
		});
		await expect(page.getByText(svc.Name!)).toBeVisible({ timeout: 15000 });

		await fillTextField(page.getByRole('searchbox', { name: 'Search' }), `${prefix}-Listed`);
		await expect(page.getByText(svc.Name!)).toBeVisible();
	});

	test('add service via dialog', async ({ page }) => {
		const name = `${prefix}-Created`;
		serviceNames.push(name);

		await page.goto('/admin/service');
		await expect(page.getByTestId('service-page')).toHaveAttribute('data-ready', 'true', {
			timeout: 15000
		});
		const addBtn = page.getByTestId('add-service');
		await expect(addBtn).toBeVisible({ timeout: 15000 });
		await addBtn.scrollIntoViewIfNeeded();
		const dialog = page.getByTestId('add-service-dialog');
		await expect(async () => {
			if (await dialog.isVisible()) return;
			await addBtn.click({ force: true });
			await expect(dialog).toBeVisible();
		}).toPass({ timeout: 15000 });
		const nameField = dialog.getByLabel('Service name');
		await fillTextField(nameField, name);
		await dialog.getByTestId('save-service').click();
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
		await expect(page.getByTestId('service-page')).toHaveAttribute('data-ready', 'true', {
			timeout: 15000
		});
		await fillTextField(page.getByRole('searchbox', { name: 'Search' }), `${prefix}-Toggle`);
		const row = page.locator('tr', { hasText: `${prefix}-Toggle` });
		await expect(row).toBeVisible({ timeout: 15000 });
		const checkbox = page.getByTestId(`service-active-${svc['Auto ID']}`);
		await expect(checkbox).toBeChecked();
		await setCheckbox(checkbox, false);

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
		await expect(page.getByTestId('service-page')).toHaveAttribute('data-ready', 'true', {
			timeout: 15000
		});
		await fillTextField(page.getByRole('searchbox', { name: 'Search' }), `${prefix}-Toggle`);
		await expect(row.getByRole('checkbox', { name: new RegExp(`Active: ${prefix}-Toggle`, 'i') })).not.toBeChecked({
			timeout: 15000
		});
	});
});
