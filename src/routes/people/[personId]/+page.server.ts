import type { person } from '#lib/types/rows.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const peopleData = await supabase
		.from('people')
		.select('*')
		.eq('Auto ID', params.personId)
		.single();

	return {
		person: peopleData?.data as person
	};
};
