import type { person } from '#lib/types/rows.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async (event) => {
	const parent = await event.parent();
	const peopleData = await parent.supabase
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
