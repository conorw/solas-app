import type { attendance, person } from '$lib/types/rows';
import { DateTime } from 'luxon';
import type { PageServerLoad } from './$types';

function groupBy(list, keyGetter, sort = true) {
	const map = new Map();
	list.forEach((item) => {
		const key = keyGetter(item);
		const collection = map.get(key);
		if (!collection) {
			map.set(key, [item]);
		} else {
			collection.push(item);
		}
	});
	return sort ? [...map.entries()].sort((a, b) => b[1].length - a[1].length) : [...map.entries()];
}
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

	// console.log(serviceData);
	let stats = (serviceData?.data || []) as attendance[];
	// pad out the data with duplicated rows for multi service attendance
	stats = stats.flatMap((stat) => {
		if (stat.Multi && stat.TotalAttendees > 1) {
			const newStats = Array(stat.TotalAttendees).fill(stat);
			return newStats;
		}
		return stat;
	});
	const groupedUser = groupBy(stats, (stat: any) => stat['Person Name']);
	return {
		stats,
		groupedUser,
		fromDate,
		toDate
	};
};
