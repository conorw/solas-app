import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';
import {
	cleanupFixtures,
	createAttendance,
	createPerson,
	createService,
	runId
} from './helpers/fixtures';
import { anonymousPersonId } from './helpers/supabase';

loadEnv();

test.describe('attendance', () => {
	const prefix = runId();
	const personIds: number[] = [];
	const serviceIds: number[] = [];
	const attendanceIds: number[] = [];

	test.afterAll(async () => {
		await cleanupFixtures({ attendanceIds, personIds, serviceIds });
	});

	test('page loads for authenticated user', async ({ page }) => {
		await page.goto('/attendance');
		await expect(page).toHaveURL(/attendance/);
		await expect(page.getByRole('heading', { name: 'Add Attendee' })).toBeVisible();
	});

	test('date query param loads that day list with fixture attendance', async ({ page }) => {
		const person = await createPerson(prefix, { FirstName: `${prefix}-Att`, LastName: 'One' });
		personIds.push(person['Auto ID']);
		const service = await createService(prefix, { Name: `${prefix}-Svc` });
		serviceIds.push(service['Auto ID']);
		const date = '2026-06-15';
		const att = await createAttendance({
			'Person Id': person['Auto ID'],
			'Person Name': `${person.FirstName} ${person.LastName}`,
			ServiceName: service.Name!,
			Date: date
		});
		attendanceIds.push(att['Auto ID']);

		await page.goto(`/attendance?date=${date}`);
		await expect(page.locator('.mdc-card').filter({ hasText: person.FirstName })).toBeVisible({
			timeout: 15000
		});
	});

	test('delete removes an attendance row from the list', async ({ page }) => {
		const person = await createPerson(prefix, { FirstName: `${prefix}-Del`, LastName: 'Row' });
		personIds.push(person['Auto ID']);
		const service = await createService(prefix, { Name: `${prefix}-DelSvc` });
		serviceIds.push(service['Auto ID']);
		const date = '2026-06-16';
		const att = await createAttendance({
			'Person Id': person['Auto ID'],
			'Person Name': `${person.FirstName} ${person.LastName}`,
			ServiceName: service.Name!,
			Date: date
		});
		attendanceIds.push(att['Auto ID']);

		await page.goto(`/attendance?date=${date}`);
		const card = page.locator('.mdc-card').filter({ hasText: person.FirstName });
		await expect(card).toBeVisible({ timeout: 15000 });
		await card.locator('.material-icons', { hasText: 'delete' }).click();
		await expect(page.locator('.mdc-card').filter({ hasText: person.FirstName })).toHaveCount(0, {
			timeout: 10000
		});
	});

	test('multi attendance fixture appears as Multi row', async ({ page }) => {
		const service = await createService(prefix, {
			Name: `${prefix}-MultiEvt`,
			Multi: true,
			'Is Current': true
		});
		serviceIds.push(service['Auto ID']);
		const date = '2026-06-17';
		const att = await createAttendance({
			'Person Id': anonymousPersonId(),
			'Person Name': 'Anonymous Attendee',
			ServiceName: service.Name!,
			Date: date,
			Multi: true,
			TotalAttendees: 12
		});
		attendanceIds.push(att['Auto ID']);

		await page.goto(`/attendance?date=${date}`);
		await expect(
			page.locator('.mdc-card').filter({ hasText: `${service.Name} (Multi)` })
		).toBeVisible({ timeout: 15000 });
	});
});
