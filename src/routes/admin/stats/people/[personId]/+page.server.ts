import type { attendance, person } from '#lib/types/rows.js';
import type { PageServerLoad } from './$types';
import { groupBy, monthKey, popularServiceLabel } from '#lib/stats.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const personId = Number(params.personId);
	const [serviceData, peopleData] = await Promise.all([
		locals.supabase
			.from('attendance')
			.select(`*`)
			.order('Date', { ascending: false })
			.eq('Person Id', personId),
		locals.supabase.from('people').select(`*`).eq(`Auto ID`, personId).single()
	]);

	const stats = (serviceData?.data || []) as attendance[];

	const groupedService = groupBy(stats, (stat: { ServiceName: any }) => stat.ServiceName);
	const groupedByMonth = groupBy(stats, (stat: attendance) => monthKey(stat.Date));
	const popularService = groupedService.length
		? popularServiceLabel(groupedService)
		: popularServiceLabel([]);

	return {
		stats,
		popularService,
		groupedByMonth,
		groupedService,
		personId,
		person: peopleData?.data as person
	};
};
