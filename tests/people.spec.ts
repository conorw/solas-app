import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';
import { cleanupFixtures, createPerson, runId } from './helpers/fixtures';
import { getServiceClient } from './helpers/supabase';
import { fillTextField } from './helpers/smui';

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
		const search = page.getByRole('searchbox', { name: 'Search' });
		await fillTextField(search, prefix);
		await expect(page.locator('.result-count')).toHaveText(/2\s+people/i, { timeout: 15000 });
		await expect(page.getByRole('cell', { name: a.FirstName, exact: true })).toBeVisible();
		await expect(page.getByRole('cell', { name: b.FirstName, exact: true })).toBeVisible();

		await fillTextField(search, `${prefix}-Alpha`);
		await expect(page.locator('.result-count')).toHaveText(/1\s+person/i, { timeout: 10000 });
		await expect(page.getByRole('cell', { name: a.FirstName, exact: true })).toBeVisible();
		await expect(page.getByRole('cell', { name: b.FirstName, exact: true })).toHaveCount(0);
	});

	test('search query is persisted in the URL', async ({ page }) => {
		const term = `${prefix}-Url`;
		const a = await createPerson(prefix, { FirstName: `${term}Alpha`, LastName: 'Search' });
		const b = await createPerson(prefix, { FirstName: `${term}Beta`, LastName: 'Search' });
		personIds.push(a['Auto ID'], b['Auto ID']);

		await page.goto('/people');
		const search = page.getByRole('searchbox', { name: 'Search' });
		await fillTextField(search, term);
		await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(term);
		await expect(page.locator('.result-count')).toHaveText(/2\s+people/i, { timeout: 15000 });

		await page.getByRole('button', { name: 'Clear' }).click();
		await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBeNull();
		await expect(search).toHaveValue('');

		await page.goto(`/people?q=${encodeURIComponent(term)}`);
		await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(term);
		await expect(page.locator('.result-count')).toHaveText(/2\s+people/i, { timeout: 15000 });
		await expect(page.getByRole('cell', { name: a.FirstName, exact: true })).toBeVisible();
		await expect(page.getByRole('cell', { name: b.FirstName, exact: true })).toBeVisible();

		await page.getByRole('link', { name: a.FirstName, exact: true }).click();
		await expect(page.getByRole('heading', { name: /edit person/i })).toBeVisible({ timeout: 15000 });
		await page.goBack();
		await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(term);
		await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(term);
		await expect(page.getByRole('cell', { name: a.FirstName, exact: true })).toBeVisible();
		await expect(page.getByRole('cell', { name: b.FirstName, exact: true })).toBeVisible();
	});

	test('back restores the latest search, not an earlier one', async ({ page }) => {
		const earlier = `${prefix}-Earlier`;
		const latest = `${prefix}-Latest`;
		const person = await createPerson(prefix, { FirstName: latest, LastName: 'Search' });
		personIds.push(person['Auto ID']);

		await page.goto('/people');
		const search = page.getByRole('searchbox', { name: 'Search' });
		await fillTextField(search, earlier);
		await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(earlier);

		await fillTextField(search, latest);
		await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(latest);
		await expect(page.getByRole('cell', { name: latest, exact: true })).toBeVisible({
			timeout: 15000
		});

		await page.getByRole('link', { name: latest, exact: true }).click();
		await expect(page.getByRole('heading', { name: /edit person/i })).toBeVisible({ timeout: 15000 });
		await page.goBack();

		const restored = page.getByRole('searchbox', { name: 'Search' });
		await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(latest);
		await expect(restored).toHaveValue(latest);
		await expect(async () => {
			await new Promise((r) => setTimeout(r, 400));
			expect(new URL(page.url()).searchParams.get('q')).toBe(latest);
			expect(await restored.inputValue()).toBe(latest);
		}).toPass({ timeout: 2000 });
		await expect(page.getByRole('cell', { name: latest, exact: true })).toBeVisible();
	});

	test('create person via /people/new', async ({ page }) => {
		const first = `${prefix}-New`;
		const last = 'Person';
		const sb = getServiceClient();

		await page.goto('/people/new');
		await expect(page.getByTestId('person-form')).toHaveAttribute('data-ready', 'true', {
			timeout: 15000
		});
		await fillTextField(page.getByLabel('First Name'), first);
		await fillTextField(page.getByLabel('Last Name'), last);
		await page.getByTestId('save-person').click();

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
		const search = page.getByRole('searchbox', { name: 'Search' });
		await fillTextField(search, first);
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
		await expect(page.getByTestId('person-form')).toHaveAttribute('data-ready', 'true', {
			timeout: 15000
		});
		await expect(page.getByRole('heading', { name: /edit person/i })).toBeVisible({ timeout: 15000 });
		const lastNameField = page.locator('.person-form').getByLabel('Last Name');
		await fillTextField(lastNameField, 'Updated');
		await expect(lastNameField).toHaveValue('Updated');
		await page.getByTestId('save-person').click();

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
		await fillTextField(page.getByRole('searchbox', { name: 'Search' }), firstName);
		const row = page.locator('tr', { hasText: firstName });
		await expect(row).toBeVisible({ timeout: 15000 });

		const deleteBtn = row.getByTestId('delete-person');
		await deleteBtn.scrollIntoViewIfNeeded();
		page.once('dialog', (dialog) => dialog.accept());
		await deleteBtn.click();

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
