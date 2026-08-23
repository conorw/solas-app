import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
	groupBy,
	expandMultiAttendance,
	popularServiceLabel,
	monthKey,
	displayLabel,
	countByLabel,
	ageBand,
	whoAttendedStats
} from './stats';

describe('groupBy', () => {
	it('groups by key and sorts by group size descending', () => {
		const items = [
			{ ServiceName: 'A' },
			{ ServiceName: 'B' },
			{ ServiceName: 'A' },
			{ ServiceName: 'A' }
		];
		const grouped = groupBy(items, (s) => s.ServiceName);
		expect(grouped[0][0]).toBe('A');
		expect(grouped[0][1]).toHaveLength(3);
		expect(grouped[1][0]).toBe('B');
		expect(grouped[1][1]).toHaveLength(1);
	});

	it('returns empty array for empty input', () => {
		expect(groupBy([], (x) => x)).toEqual([]);
	});

	it('can skip sorting', () => {
		const items = [{ k: 'z' }, { k: 'a' }, { k: 'a' }];
		const grouped = groupBy(items, (s) => s.k, false);
		expect(grouped.map(([k]) => k)).toEqual(['z', 'a']);
	});
});

describe('expandMultiAttendance', () => {
	it('expands Multi rows by TotalAttendees', () => {
		const rows = [
			{ Multi: true, TotalAttendees: 3, ServiceName: 'Bulk' },
			{ Multi: false, TotalAttendees: 1, ServiceName: 'One' }
		];
		const expanded = expandMultiAttendance(rows);
		expect(expanded).toHaveLength(4);
		expect(expanded.filter((r) => r.ServiceName === 'Bulk')).toHaveLength(3);
	});

	it('leaves non-multi rows unchanged', () => {
		const rows = [{ Multi: false, TotalAttendees: 5, ServiceName: 'X' }];
		expect(expandMultiAttendance(rows)).toHaveLength(1);
	});

	it('does not expand when TotalAttendees is 1', () => {
		const rows = [{ Multi: true, TotalAttendees: 1, ServiceName: 'X' }];
		expect(expandMultiAttendance(rows)).toHaveLength(1);
	});
});

describe('popularServiceLabel', () => {
	it('formats the largest group', () => {
		expect(popularServiceLabel([['Yoga', [1, 2, 3]]])).toBe('Yoga (3)');
	});

	it('returns No Data when empty', () => {
		expect(popularServiceLabel([])).toBe('No Data');
	});
});

describe('monthKey', () => {
	it('returns month name from ISO date', () => {
		expect(monthKey('2026-03-15')).toBe('March');
	});

	it('handles null', () => {
		expect(monthKey(null)).toBeUndefined();
	});
});

describe('displayLabel', () => {
	it('trims and returns value', () => {
		expect(displayLabel('  Galway  ')).toBe('Galway');
	});

	it('uses empty label for blank', () => {
		expect(displayLabel('')).toBe('Not set');
		expect(displayLabel(null, 'Unknown')).toBe('Unknown');
	});
});

describe('countByLabel', () => {
	it('counts and sorts by size then label', () => {
		expect(countByLabel(['B', 'A', 'A', 'C'])).toEqual([
			{ label: 'A', count: 2 },
			{ label: 'B', count: 1 },
			{ label: 'C', count: 1 }
		]);
	});
});

describe('ageBand', () => {
	const asOf = DateTime.fromISO('2026-08-23');

	it('maps DOB into bands', () => {
		expect(ageBand('2015-01-01', asOf)).toBe('Under 18');
		expect(ageBand('2000-01-01', asOf)).toBe('25–34');
		expect(ageBand('1950-01-01', asOf)).toBe('65+');
	});

	it('returns Unknown for missing/invalid', () => {
		expect(ageBand(null, asOf)).toBe('Unknown');
		expect(ageBand('not-a-date', asOf)).toBe('Unknown');
	});
});

describe('whoAttendedStats', () => {
	const asOf = DateTime.fromISO('2026-08-23');
	const anonymousId = 2830;

	it('dedupes people and skips anonymous', () => {
		const stats = whoAttendedStats(
			[
				{
					'Person Id': 1,
					people: {
						Gender: 'Female',
						Town: 'Galway',
						DateOfBirth: '1990-06-01',
						Carer: true,
						Disability: false,
						'Marketing Opt Out': false,
						'Referral Source': 'GP',
						'Other Support': ''
					}
				},
				{
					'Person Id': 1,
					people: { Gender: 'Female', Town: 'Galway', DateOfBirth: '1990-06-01' }
				},
				{
					'Person Id': anonymousId,
					people: { Gender: 'Male', Town: 'Other' }
				},
				{
					'Person Id': 2,
					people: {
						Gender: 'Male',
						Town: '',
						DateOfBirth: null,
						Carer: false,
						Disability: true,
						'Marketing Opt Out': true,
						'Referral Source': null,
						'Other Support': 'CMHT'
					}
				}
			],
			anonymousId,
			asOf
		);

		expect(stats.uniqueNamed).toBe(2);
		expect(stats.carers).toBe(1);
		expect(stats.disability).toBe(1);
		expect(stats.marketingOptOut).toBe(1);
		expect(stats.marketingReachable).toBe(1);
		expect(stats.referralBlank).toBe(1);
		expect(stats.otherSupportBlank).toBe(1);
		expect(stats.gender).toEqual([
			{ label: 'Female', count: 1 },
			{ label: 'Male', count: 1 }
		]);
		expect(stats.ageBands.find((r) => r.label === '35–44')?.count).toBe(1);
		expect(stats.ageBands.find((r) => r.label === 'Unknown')?.count).toBe(1);
		expect(stats.referralSource.find((r) => r.label === 'GP')?.count).toBe(1);
		expect(stats.otherSupport.find((r) => r.label === 'CMHT')?.count).toBe(1);
	});
});
