import { test, expect } from '@playwright/test';
import { loadEnv } from './helpers/env';
import {
	cleanupFixtures,
	createAttendance,
	createPerson,
	createService,
	runId
} from './helpers/fixtures';
import { getServiceClient } from './helpers/supabase';

loadEnv();

test.describe('admin people merge', () => {
	const prefix = runId();
	const personIds: number[] = [];
	const serviceIds: number[] = [];
	const attendanceIds: number[] = [];

	test.afterAll(async () => {
		await cleanupFixtures({ attendanceIds, personIds, serviceIds });
	});

	test('merge moves secondary attendance onto primary', async ({ page }) => {
		const primary = await createPerson(prefix, {
			FirstName: `${prefix}-Primary`,
			LastName: 'Keep'
		});
		const secondary = await createPerson(prefix, {
			FirstName: `${prefix}-Secondary`,
			LastName: 'Merge'
		});
		personIds.push(primary['Auto ID'], secondary['Auto ID']);

		const service = await createService(prefix, { Name: `${prefix}-MergeSvc` });
		serviceIds.push(service['Auto ID']);

		const att = await createAttendance({
			'Person Id': secondary['Auto ID'],
			'Person Name': `${secondary.FirstName} ${secondary.LastName}`,
			ServiceName: service.Name!,
			Date: '2026-04-01'
		});
		attendanceIds.push(att['Auto ID']);

		await page.goto('/admin/people/merge');
		const result = await page.evaluate(
			async ({ primaryId, secondaryId }) => {
				const fd = new FormData();
				fd.append('primaryPersonId', String(primaryId));
				fd.append('secondaryPersonId', String(secondaryId));
				const res = await fetch('?/merge', { method: 'POST', body: fd });
				return { status: res.status, text: await res.text() };
			},
			{ primaryId: primary['Auto ID'], secondaryId: secondary['Auto ID'] }
		);
		expect(result.status).toBeLessThan(400);
		expect(result.text).toMatch(/success|recordsUpdated/i);

		const sb = getServiceClient();
		await expect
			.poll(
				async () => {
					const { data: moved } = await sb
						.from('attendance')
						.select('"Person Id", "Person Name"')
						.eq('Auto ID', att['Auto ID'])
						.single();
					return moved?.['Person Id'];
				},
				{ timeout: 15000 }
			)
			.toBe(primary['Auto ID']);
	});

	test('validation rejects same primary and secondary', async ({ page }) => {
		const person = await createPerson(prefix, { FirstName: `${prefix}-Same`, LastName: 'Id' });
		personIds.push(person['Auto ID']);

		await page.goto('/admin/people/merge');
		const result = await page.evaluate(async (personId) => {
			const fd = new FormData();
			fd.append('primaryPersonId', String(personId));
			fd.append('secondaryPersonId', String(personId));
			const res = await fetch('?/merge', { method: 'POST', body: fd });
			return await res.text();
		}, person['Auto ID']);
		expect(result).toMatch(/must be different|error/i);
	});

	test('validation rejects missing ids', async ({ page }) => {
		await page.goto('/admin/people/merge');
		const result = await page.evaluate(async () => {
			const fd = new FormData();
			fd.append('primaryPersonId', '');
			fd.append('secondaryPersonId', '');
			const res = await fetch('?/merge', { method: 'POST', body: fd });
			return await res.text();
		});
		expect(result).toMatch(/must be selected|error/i);
	});
});

test.describe('merge as non-admin', () => {
	test.use({ storageState: 'tests/.auth/user.json' });

	test('non-admin is redirected away from merge page', async ({ page }) => {
		await page.goto('/admin/people/merge');
		await expect(page).toHaveURL(/attendance/);
	});
});
