import type { attendanceWithPeople } from '#lib/types/rows.js';
import { DateTime } from 'luxon';
import type { PageServerLoad } from './$types';
import {
	expandMultiAttendance,
	groupBy,
	monthKey,
	popularServiceLabel
} from '#lib/stats.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const fromDate: string =
		url.searchParams.get('fromDate') || DateTime.now().startOf('year').toFormat('yyyy-MM-dd');
	const toDate: string =
		url.searchParams.get('toDate') || DateTime.now().endOf('year').toFormat('yyyy-MM-dd');
	const [serviceData] = await Promise.all([
		locals.supabase
			.from('attendance')
			.select(`*, people("Email")`)
			.order('Date', { ascending: true })
			.gte('Date', fromDate)
			.lte('Date', toDate)
	]);

	let stats = expandMultiAttendance((serviceData?.data || []) as attendanceWithPeople[]);

	stats = stats.map((stat) => {
		return {
			...stat,
			email: stat.people?.Email || '',
			people: null
		};
	});

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
		groupedService
	};
};
