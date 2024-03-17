import { DateTime } from 'luxon';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url, data, parent }) => {
	const dt = url.searchParams.get('date') || DateTime.now().toISODate();

	const supabase = (await parent()).supabase;
	const [peopleData, serviceData] = await Promise.all([
		supabase
			.from('people')
			.select(`"Auto ID", "LastName", "FirstName", "DateOfBirth", "Acupuncture Data"`)
			.order('FirstName', { ascending: true }),
		supabase.from('service').select().eq(`Is Current`, true).order('Name', { ascending: true })
	]);

	// if (error && status !== 406) throw error

	return {
		people: peopleData?.data || [],
		service: serviceData?.data || [],
		date: dt
	};
};
