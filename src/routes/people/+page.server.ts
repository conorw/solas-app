import type { person } from '#lib/types/rows.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const peopleData = await supabase
		.from('people')
		.select(`"Auto ID", "FirstName", "LastName", "DateOfBirth"`);

	const people = ((peopleData?.data || []) as unknown as person[]).sort((a, b) => {
		const first = (a.FirstName ?? '').localeCompare(b.FirstName ?? '', undefined, {
			sensitivity: 'base'
		});
		if (first !== 0) return first;
		return (a.LastName ?? '').localeCompare(b.LastName ?? '', undefined, {
			sensitivity: 'base'
		});
	});

	return { people };
};
