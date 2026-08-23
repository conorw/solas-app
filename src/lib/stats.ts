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
			return Array(stat.TotalAttendees).fill(stat) as T[];
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
