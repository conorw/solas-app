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
		await expect(page.getByText(/Total Unique People/i)).toBeVisible({ timeout: 20000 });
		await expect(page.getByText(/Total Sessions/i)).toBeVisible();
		await expect(page.getByRole('link', { name: serviceName })).toBeVisible();
	});

	test('person drill-down loads', async ({ page }) => {
		await page.goto(`/admin/stats/people/${personIds[0]}`);
		await expect(page.getByRole('heading', { name: /Most Popular Service/i })).toBeVisible({
			timeout: 15000
		});
	});

	test('service drill-down loads', async ({ page }) => {
		const name = encodeURIComponent(serviceName);
		await page.goto(`/admin/stats/services/${name}`);
		await expect(page.getByRole('heading', { name: serviceName })).toBeVisible({
			timeout: 15000
		});
	});
});
