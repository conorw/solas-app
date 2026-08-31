import type { service } from '#lib/types/rows.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const serviceData = await supabase.from('service').select('*').order('Name', { ascending: true });

	return {
		service: (serviceData?.data || []) as service[]
	};
};
