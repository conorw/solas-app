import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	sanitizeUrl,
	pickAnalyticsProps,
	capture,
	capturePageview,
	identifyStaff,
	resetAnalytics,
	__setAnalyticsClientForTests
} from './analytics';

describe('sanitizeUrl', () => {
	it('redacts numeric people ids', () => {
		expect(sanitizeUrl('/people/123')).toBe('/people/:id');
		expect(sanitizeUrl('https://example.com/people/123')).toBe('/people/:id');
	});

	it('redacts admin person stats ids', () => {
		expect(sanitizeUrl('/admin/stats/people/99')).toBe('/admin/stats/people/:id');
	});

	it('keeps /people/new and other non-id people paths', () => {
		expect(sanitizeUrl('/people/new')).toBe('/people/new');
		expect(sanitizeUrl('/people')).toBe('/people');
	});

	it('keeps service stats slugs', () => {
		expect(sanitizeUrl('/admin/stats/services/Yoga%20Class')).toBe(
			'/admin/stats/services/Yoga%20Class'
		);
	});

	it('drops name-search q and keeps date params', () => {
		expect(sanitizeUrl('/people?q=smith')).toBe('/people');
		expect(sanitizeUrl('/attendance?date=2026-09-06&q=secret')).toBe('/attendance?date=2026-09-06');
		expect(sanitizeUrl('/admin/stats?fromDate=2026-01-01&toDate=2026-09-01')).toBe(
			'/admin/stats?fromDate=2026-01-01&toDate=2026-09-01'
		);
	});

	it('returns / for invalid input', () => {
		expect(sanitizeUrl('http://[')).toBe('/');
	});
});

describe('pickAnalyticsProps', () => {
	it('keeps allowlisted props', () => {
		expect(
			pickAnalyticsProps({
				serviceName: 'Drop-in',
				isMulti: true,
				count: 4,
				exportType: 'pdf',
				queryLength: 3,
				isAdmin: false,
				flag: 'Multi'
			})
		).toEqual({
			serviceName: 'Drop-in',
			isMulti: true,
			count: 4,
			exportType: 'pdf',
			queryLength: 3,
			isAdmin: false,
			flag: 'Multi'
		});
	});

	it('drops unknown keys including PII', () => {
		expect(
			pickAnalyticsProps({
				serviceName: 'Drop-in',
				email: 'staff@example.com',
				name: 'Jane Smith',
				personId: 123,
				error: 'duplicate Jane Smith',
				q: 'smith'
			} as Record<string, unknown>)
		).toEqual({ serviceName: 'Drop-in' });
	});

	it('drops invalid allowlisted values', () => {
		expect(
			pickAnalyticsProps({
				exportType: 'xlsx',
				flag: 'Secret',
				count: Number.NaN,
				queryLength: '3'
			} as Record<string, unknown>)
		).toEqual({});
	});

	it('returns empty object for nullish props', () => {
		expect(pickAnalyticsProps(null)).toEqual({});
		expect(pickAnalyticsProps(undefined)).toEqual({});
	});
});

describe('capture allowlist', () => {
	afterEach(() => {
		__setAnalyticsClientForTests(null, false);
	});

	it('sends only allowlisted properties to the client', () => {
		const captureFn = vi.fn();
		__setAnalyticsClientForTests({
			capture: captureFn,
			identify: vi.fn(),
			reset: vi.fn()
		});

		capture('attendance_named_added', {
			serviceName: 'Drop-in',
			email: 'a@b.c',
			personId: 9
		} as Record<string, unknown>);

		expect(captureFn).toHaveBeenCalledWith('attendance_named_added', {
			serviceName: 'Drop-in'
		});
	});

	it('sanitizes pageview urls', () => {
		const captureFn = vi.fn();
		__setAnalyticsClientForTests({
			capture: captureFn,
			identify: vi.fn(),
			reset: vi.fn()
		});

		capturePageview('/people/42?q=smith&date=2026-09-06');
		expect(captureFn).toHaveBeenCalledWith('$pageview', {
			$current_url: '/people/:id?date=2026-09-06',
			$pathname: '/people/:id?date=2026-09-06'
		});
	});

	it('identifies with staff uuid and is_admin only', () => {
		const identify = vi.fn();
		__setAnalyticsClientForTests({
			capture: vi.fn(),
			identify,
			reset: vi.fn()
		});

		identifyStaff('user-uuid', true);
		expect(identify).toHaveBeenCalledWith('user-uuid', { is_admin: true });
	});

	it('resets the client', () => {
		const reset = vi.fn();
		__setAnalyticsClientForTests({
			capture: vi.fn(),
			identify: vi.fn(),
			reset
		});
		resetAnalytics();
		expect(reset).toHaveBeenCalledTimes(1);
	});
});
