import { describe, it, expect } from 'vitest';
import {
	groupBy,
	expandMultiAttendance,
	popularServiceLabel,
	monthKey
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
