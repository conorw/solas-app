import { DateTime } from 'luxon';

/** Group items by a key; optionally sort groups by size descending. */
export function groupBy<T>(
	list: T[],
	keyGetter: (item: T) => unknown,
	sort = true
): [unknown, T[]][] {
	const map = new Map<unknown, T[]>();
	list.forEach((item) => {
		const key = keyGetter(item);
		const collection = map.get(key);
		if (!collection) {
			map.set(key, [item]);
		} else {
			collection.push(item);
		}
	});
	return sort
		? [...map.entries()].sort((a, b) => b[1].length - a[1].length)
		: [...map.entries()];
}

type MultiAttendance = {
	Multi?: boolean | null;
	TotalAttendees?: number | null;
};

/** Expand multi-attendee rows into TotalAttendees duplicate entries. */
export function expandMultiAttendance<T extends MultiAttendance>(stats: T[]): T[] {
	return stats.flatMap((stat) => {
		if (stat.Multi && (stat.TotalAttendees ?? 0) > 1) {
			return Array(stat.TotalAttendees ?? 0).fill(stat) as T[];
		}
		return [stat];
	});
}

export function popularServiceLabel(
	groupedService: [unknown, unknown[]][]
): string {
	return groupedService.length
		? `${groupedService[0][0]} (${groupedService[0][1].length})`
		: 'No Data';
}

export function monthKey(date: string | null | undefined): string | undefined {
	if (!date) return undefined;
	return DateTime.fromISO(date).monthLong ?? undefined;
}

export type CountRow = { label: string; count: number };

/** Normalize blank/null string fields for grouping. */
export function displayLabel(value: string | null | undefined, empty = 'Not set'): string {
	if (value == null || !String(value).trim()) return empty;
	return String(value).trim();
}

export function countByLabel(labels: string[]): CountRow[] {
	const map = new Map<string, number>();
	for (const label of labels) {
		map.set(label, (map.get(label) ?? 0) + 1);
	}
	return [...map.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const AGE_BANDS = [
	{ max: 18, label: 'Under 18' },
	{ max: 25, label: '18–24' },
	{ max: 35, label: '25–34' },
	{ max: 45, label: '35–44' },
	{ max: 55, label: '45–54' },
	{ max: 65, label: '55–64' },
	{ max: Infinity, label: '65+' }
] as const;

/** Age band from ISO DOB; unknown when missing/invalid. */
export function ageBand(
	dob: string | null | undefined,
	asOf: DateTime = DateTime.now()
): string {
	if (!dob?.trim()) return 'Unknown';
	const birth = DateTime.fromISO(dob.trim());
	if (!birth.isValid) return 'Unknown';
	const age = Math.floor(asOf.diff(birth, 'years').years);
	if (age < 0 || !Number.isFinite(age)) return 'Unknown';
	for (const band of AGE_BANDS) {
		if (age < band.max) return band.label;
	}
	return '65+';
}

export type AttendeePersonFields = {
	Gender?: string | null;
	Town?: string | null;
	DateOfBirth?: string | null;
	Carer?: boolean | null;
	Disability?: boolean | null;
	'Marketing Opt Out'?: boolean | null;
	'Referral Source'?: string | null;
	'Other Support'?: string | null;
};

export type WhoAttendedStats = {
	uniqueNamed: number;
	ageBands: CountRow[];
	gender: CountRow[];
	town: CountRow[];
	referralSource: CountRow[];
	otherSupport: CountRow[];
	carers: number;
	disability: number;
	marketingOptOut: number;
	marketingReachable: number;
	referralBlank: number;
	otherSupportBlank: number;
};

/** Unique named attendees (excludes anonymous/multi person id) with demographic counts. */
export function whoAttendedStats(
	rows: { 'Person Id'?: number | null; people?: AttendeePersonFields | null }[],
	anonymousPersonId: number,
	asOf: DateTime = DateTime.now()
): WhoAttendedStats {
	const byId = new Map<number, AttendeePersonFields>();
	for (const row of rows) {
		const id = row['Person Id'];
		if (id == null || id === anonymousPersonId || byId.has(id)) continue;
		byId.set(id, row.people ?? {});
	}

	const people = [...byId.values()];
	const blank = (v: string | null | undefined) => !v?.trim();

	return {
		uniqueNamed: people.length,
		ageBands: countByLabel(people.map((p) => ageBand(p.DateOfBirth, asOf))),
		gender: countByLabel(people.map((p) => displayLabel(p.Gender, 'Unknown'))),
		town: countByLabel(people.map((p) => displayLabel(p.Town))),
		referralSource: countByLabel(people.map((p) => displayLabel(p['Referral Source']))),
		otherSupport: countByLabel(people.map((p) => displayLabel(p['Other Support']))),
		carers: people.filter((p) => p.Carer === true).length,
		disability: people.filter((p) => p.Disability === true).length,
		marketingOptOut: people.filter((p) => p['Marketing Opt Out'] === true).length,
		marketingReachable: people.filter((p) => p['Marketing Opt Out'] !== true).length,
		referralBlank: people.filter((p) => blank(p['Referral Source'])).length,
		otherSupportBlank: people.filter((p) => blank(p['Other Support'])).length
	};
}
