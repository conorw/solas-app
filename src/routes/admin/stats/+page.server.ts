import type { attendanceWithPeople } from '#lib/types/rows.js';
import { ANONYMOUS_PERSON_ID } from '#lib/constants.js';
import { DateTime } from 'luxon';
import type { PageServerLoad } from './$types';
import {
	expandMultiAttendance,
	groupBy,
	monthKey,
	popularServiceLabel,
	whoAttendedStats
} from '#lib/stats.js';

const PEOPLE_FIELDS =
	'Email, Gender, Town, DateOfBirth, Carer, Disability, "Marketing Opt Out", "Referral Source", "Other Support"';

export const load: PageServerLoad = async ({ url, locals }) => {
	const fromDate: string =
		url.searchParams.get('fromDate') || DateTime.now().startOf('year').toFormat('yyyy-MM-dd');
	const toDate: string =
		url.searchParams.get('toDate') || DateTime.now().endOf('year').toFormat('yyyy-MM-dd');

	const { data: attendanceRows } = await locals.supabase
		.from('attendance')
		.select(`*, people(${PEOPLE_FIELDS})`)
		.order('Date', { ascending: true })
		.gte('Date', fromDate)
		.lte('Date', toDate);

	const raw = (attendanceRows || []) as attendanceWithPeople[];
	const whoAttended = whoAttendedStats(raw, ANONYMOUS_PERSON_ID);

	let stats = expandMultiAttendance(raw);
	stats = stats.map((stat) => ({
		...stat,
		email: stat.people?.Email || '',
		people: null
	}));

	const groupedService = groupBy(stats, (stat: { ServiceName: any }) => stat.ServiceName);
	const groupedByMonth = groupBy(stats, (stat: attendanceWithPeople) => monthKey(stat.Date));
	const groupedUser = groupBy(stats, (stat: attendanceWithPeople) => stat['Person Id']);

	return {
		stats,
		fromDate,
		toDate,
		popularService: popularServiceLabel(groupedService),
		groupedByMonth,
		groupedUser,
		groupedService,
		whoAttended
	};
};
