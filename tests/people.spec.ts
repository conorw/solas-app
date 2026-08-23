import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';
import { cleanupFixtures, createPerson, runId } from './helpers/fixtures';
import { getServiceClient } from './helpers/supabase';

loadEnv();

test.describe('people', () => {
	const prefix = runId();
	const personIds: number[] = [];

	test.afterAll(async () => {
		await cleanupFixtures({ personIds });
	});

	test('list renders and search filters by name', async ({ page }) => {
		const a = await createPerson(prefix, { FirstName: `${prefix}-Alpha`, LastName: 'Search' });
		const b = await createPerson(prefix, { FirstName: `${prefix}-Beta`, LastName: 'Search' });
		personIds.push(a['Auto ID'], b['Auto ID']);

		await page.goto('/people');
		await expect(page.getByRole('cell', { name: a.FirstName, exact: true })).toBeVisible({
			timeout: 15000
		});
		await expect(page.getByRole('cell', { name: b.FirstName, exact: true })).toBeVisible();

		const search = page.getByLabel('Search');
		await search.fill(`${prefix}-Alpha`);
		await expect(page.getByRole('cell', { name: a.FirstName, exact: true })).toBeVisible();
		await expect(page.getByRole('cell', { name: b.FirstName, exact: true })).toHaveCount(0);
	});

	test('create person via /people/new', async ({ page }) => {
		const first = `${prefix}-New`;
		const last = 'Person';
		const sb = getServiceClient();

		await page.goto('/people/new');
		await page.getByLabel('First Name').fill(first);
		await page.getByLabel('Last Name').fill(last);
		await page.getByRole('button', { name: /save/i }).click();

		await expect
			.poll(
				async () => {
					const { data } = await sb
						.from('people')
						.select('"Auto ID", FirstName, LastName')
						.eq('FirstName', first)
						.eq('LastName', last)
						.maybeSingle();
					if (data?.['Auto ID'] && !personIds.includes(data['Auto ID'])) {
						personIds.push(data['Auto ID']);
					}
					return data?.['Auto ID'] ?? null;
				},
				{ timeout: 20000 }
			)
			.not.toBeNull();

		await page.goto('/people', { waitUntil: 'domcontentloaded' });
		await expect(page.getByRole('cell', { name: first, exact: true })).toBeVisible({
			timeout: 15000
		});
	});

	test('edit person and delete person', async ({ page }) => {
		test.setTimeout(120_000);
		const firstName = `${prefix}-Edit`;
		const person = await createPerson(prefix, {
			FirstName: firstName,
			LastName: 'Me'
		});
		personIds.push(person['Auto ID']);
		const sb = getServiceClient();

		await page.goto(`/people/${person['Auto ID']}`);
		await page.getByLabel('Last Name').fill('Updated');
		await page.getByRole('button', { name: /save/i }).click();

		await expect
			.poll(
				async () => {
					const { data } = await sb
						.from('people')
						.select('LastName')
						.eq('Auto ID', person['Auto ID'])
						.single();
					return data?.LastName;
				},
				{ timeout: 20000 }
			)
			.toBe('Updated');

		await page.goto('/people', { waitUntil: 'domcontentloaded' });
		const row = page.locator('tr', { hasText: firstName });
		await expect(row).toBeVisible({ timeout: 15000 });

		const deleteBtn = row.getByRole('button', { name: 'Delete person' });
		await deleteBtn.scrollIntoViewIfNeeded();
		await Promise.all([
			page.waitForEvent('dialog').then((d) => d.accept()),
			deleteBtn.click()
		]);

		await expect(page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 15000 });
		await expect(row).toHaveCount(0, { timeout: 10000 });

		await expect
			.poll(
				async () => {
					const { data } = await sb
						.from('people')
						.select('"Auto ID"')
						.eq('Auto ID', person['Auto ID'])
						.maybeSingle();
					return data;
				},
				{ timeout: 20000 }
			)
			.toBeNull();
		personIds.pop();
	});
});
