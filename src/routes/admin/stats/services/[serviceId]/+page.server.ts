import type { attendance } from '#lib/types/rows.js';
import { DateTime } from 'luxon';
import type { PageServerLoad } from './$types';
import { expandMultiAttendance, groupBy } from '#lib/stats.js';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const serviceName: string = params.serviceId;
	const fromDate =
		url.searchParams.get('fromDate') || DateTime.now().startOf('year').toFormat('yyyy-MM-dd');
	const toDate =
		url.searchParams.get('toDate') || DateTime.now().endOf('year').toFormat('yyyy-MM-dd');
	const [serviceData] = await Promise.all([
		locals.supabase
			.from('attendance')
			.select(`*, people("Email", "Marketing Opt Out", "Phone")`)
			.gte('Date', fromDate)
			.lte('Date', toDate)
			.order('Date', { ascending: false })
			.eq('ServiceName', serviceName)
	]);

	const stats = expandMultiAttendance((serviceData?.data || []) as attendance[]);
	const groupedUser = groupBy(stats, (stat: any) => stat['Person Name']);
	return {
		stats,
		groupedUser,
		fromDate,
		toDate
	};
};
