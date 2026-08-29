import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';
import {
	cleanupFixtures,
	createAttendance,
	createPerson,
	createService,
	runId
} from './helpers/fixtures';

loadEnv();

test.describe('admin stats', () => {
	const prefix = runId();
	const personIds: number[] = [];
	const serviceIds: number[] = [];
	const attendanceIds: number[] = [];
	const date = `${new Date().getFullYear()}-03-20`;
	const serviceName = `${prefix}-StatSvc`;

	test.afterAll(async () => {
		await cleanupFixtures({ attendanceIds, personIds, serviceIds });
	});

	test.beforeAll(async () => {
		const person = await createPerson(prefix, { FirstName: `${prefix}-Stat`, LastName: 'User' });
		personIds.push(person['Auto ID']);
		const service = await createService(prefix, { Name: serviceName });
		serviceIds.push(service['Auto ID']);
		const att = await createAttendance({
			'Person Id': person['Auto ID'],
			'Person Name': `${person.FirstName} ${person.LastName}`,
			ServiceName: service.Name!,
			Date: date
		});
		attendanceIds.push(att['Auto ID']);
	});

	test('stats page renders totals for seeded attendance', async ({ page }) => {
		await page.goto('/admin/stats');
		await expect(page.getByText(/Unique people/i)).toBeVisible({ timeout: 20000 });
		await expect(page.getByText(/Total sessions/i)).toBeVisible();
		await expect(page.getByRole('link', { name: serviceName })).toBeVisible();
	});

	test('export PDF opens section dialog then print', async ({ page }) => {
		await page.goto('/admin/stats');
		await expect(page.getByText(/Unique people/i)).toBeVisible({ timeout: 30000 });
		const exportPdf = page.getByRole('button', { name: 'Export PDF' });
		await expect(exportPdf).toBeVisible({ timeout: 10000 });
		await expect(exportPdf).toBeEnabled();

		await page.evaluate(() => {
			(window as Window & { __printCalled?: boolean }).__printCalled = false;
			window.print = () => {
				(window as Window & { __printCalled?: boolean }).__printCalled = true;
			};
		});

		await exportPdf.click();
		await expect(page.getByText('Choose which sections to include in the PDF.')).toBeVisible({
			timeout: 10000
		});
		await expect(page.getByLabel('Summary cards')).toBeChecked();
		await expect(page.getByLabel('By person table')).toBeChecked();

		await page.getByLabel('By person table').click();
		await expect(page.getByLabel('By person table')).not.toBeChecked();

		await page.getByRole('button', { name: 'Export PDF' }).last().click();
		await expect
			.poll(async () =>
				page.evaluate(() => (window as Window & { __printCalled?: boolean }).__printCalled)
			)
			.toBe(true);
	});

	test('person drill-down loads', async ({ page }) => {
		await page.goto(`/admin/stats/people/${personIds[0]}`);
		await expect(page.getByText(/Most popular service/i)).toBeVisible({
			timeout: 15000
		});
		await expect(page.getByRole('heading', { name: /Attendance history/i })).toBeVisible();
	});

	test('service drill-down loads', async ({ page }) => {
		const name = encodeURIComponent(serviceName);
		await page.goto(`/admin/stats/services/${name}`);
		await expect(page.getByRole('heading', { name: serviceName })).toBeVisible({
			timeout: 15000
		});
	});
});
