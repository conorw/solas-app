import { getServiceClient } from './supabase';

export type FixturePerson = {
	'Auto ID': number;
	FirstName: string;
	LastName: string;
	DateOfBirth: string;
};

export type FixtureService = {
	'Auto ID': number;
	Name: string;
	'Is Current': boolean;
	Multi: boolean;
};

export type FixtureAttendance = {
	'Auto ID': number;
	'Person Id': number;
	'Person Name': string | null;
	ServiceName: string | null;
	Date: string | null;
	Multi?: boolean | null;
	TotalAttendees?: number | null;
};

export function runId(): string {
	return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createPerson(
	prefix: string,
	overrides: Partial<FixturePerson> = {}
): Promise<FixturePerson> {
	const sb = getServiceClient();
	const row = {
		FirstName: overrides.FirstName ?? `${prefix}-First`,
		LastName: overrides.LastName ?? `${prefix}-Last`,
		DateOfBirth: overrides.DateOfBirth ?? '1990-01-15',
		...overrides
	};
	const { data, error } = await sb.from('people').insert(row).select('"Auto ID", FirstName, LastName, DateOfBirth').single();
	if (error) throw new Error(`createPerson: ${error.message}`);
	return data as FixturePerson;
}

export async function createService(
	prefix: string,
	overrides: Partial<FixtureService> = {}
): Promise<FixtureService> {
	const sb = getServiceClient();
	const row = {
		Name: overrides.Name ?? `${prefix}-Service`,
		'Is Current': overrides['Is Current'] ?? true,
		Multi: overrides.Multi ?? false,
		...overrides
	};
	const { data, error } = await sb
		.from('service')
		.insert(row)
		.select('"Auto ID", Name, "Is Current", Multi')
		.single();
	if (error) throw new Error(`createService: ${error.message}`);
	return data as FixtureService;
}

export async function createAttendance(row: {
	'Person Id': number;
	'Person Name': string;
	ServiceName: string;
	Date: string;
	Multi?: boolean;
	TotalAttendees?: number;
}): Promise<FixtureAttendance> {
	const sb = getServiceClient();
	const { data, error } = await sb
		.from('attendance')
		.insert(row)
		.select('"Auto ID", "Person Id", "Person Name", ServiceName, Date, Multi, TotalAttendees')
		.single();
	if (error) throw new Error(`createAttendance: ${error.message}`);
	return data as FixtureAttendance;
}

/** Delete fixture rows by Auto IDs / names. Safe to call with empty arrays. */
export async function cleanupFixtures(opts: {
	attendanceIds?: number[];
	personIds?: number[];
	serviceIds?: number[];
	serviceNames?: string[];
}) {
	const sb = getServiceClient();
	if (opts.attendanceIds?.length) {
		await sb.from('attendance').delete().in('Auto ID', opts.attendanceIds);
	}
	if (opts.personIds?.length) {
		await sb.from('attendance').delete().in('Person Id', opts.personIds);
		await sb.from('people').delete().in('Auto ID', opts.personIds);
	}
	if (opts.serviceIds?.length) {
		await sb.from('service').delete().in('Auto ID', opts.serviceIds);
	}
	if (opts.serviceNames?.length) {
		await sb.from('service').delete().in('Name', opts.serviceNames);
	}
}

/** Remove leftover e2e people/services/attendance by name prefix. */
export async function cleanupByPrefix(prefix: string) {
	const sb = getServiceClient();
	const { data: people } = await sb
		.from('people')
		.select('"Auto ID"')
		.or(`FirstName.ilike.${prefix}%,LastName.ilike.${prefix}%`);
	const personIds = (people || []).map((p) => p['Auto ID'] as number);
	if (personIds.length) {
		await sb.from('attendance').delete().in('Person Id', personIds);
		await sb.from('people').delete().in('Auto ID', personIds);
	}
	await sb.from('service').delete().ilike('Name', `${prefix}%`);
	await sb.from('attendance').delete().ilike('Person Name', `${prefix}%`);
}
