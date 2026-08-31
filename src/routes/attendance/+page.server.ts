import { DateTime } from 'luxon';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const dt = url.searchParams.get('date') || DateTime.now().toISODate();

	const [peopleData, serviceData] = await Promise.all([
		supabase
			.from('people')
			.select(`"Auto ID", "LastName", "FirstName", "DateOfBirth", "Acupuncture Data"`)
			.order('FirstName', { ascending: true }),
		supabase.from('service').select().eq(`Is Current`, true).order('Name', { ascending: true })
	]);

	return {
		people: peopleData?.data || [],
		service: serviceData?.data || [],
		date: dt
	};
};
