import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { person } from '$lib/types/rows';

export const load: PageServerLoad = async ({ locals }) => {
	// Load all people for selection
	// Admin access is already verified by +layout.server.ts
	const { data: peopleData, error: peopleError } = await locals.supabase
		.from('people')
		.select(`"Auto ID", "FirstName", "LastName", "DateOfBirth"`)
		.order('FirstName', { ascending: true });

	if (peopleError) {
		return {
			people: [] as person[],
			error: 'Failed to load people'
		};
	}

	return {
		people: (peopleData || []) as person[]
	};
};

export const actions: Actions = {
	merge: async ({ request, locals }) => {
		// Verify admin access by fetching profile
		const { session } = await locals.safeGetSession();
		if (!session?.user) {
			return fail(403, {
				error: 'Authentication required',
				success: false
			});
		}

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', session.user.id)
			.single();

		if (!profile || !profile.isAdmin) {
			return fail(403, {
				error: 'Admin access required',
				success: false
			});
		}

		const formData = await request.formData();
		const primaryPersonId = formData.get('primaryPersonId') as string;
		const secondaryPersonId = formData.get('secondaryPersonId') as string;

		// Validate inputs
		if (!primaryPersonId || !secondaryPersonId) {
			return fail(400, {
				error: 'Both primary and secondary persons must be selected',
				success: false
			});
		}

		const primaryId = parseInt(primaryPersonId);
		const secondaryId = parseInt(secondaryPersonId);

		if (isNaN(primaryId) || isNaN(secondaryId)) {
			return fail(400, {
				error: 'Invalid person IDs',
				success: false
			});
		}

		if (primaryId === secondaryId) {
			return fail(400, {
				error: 'Primary and secondary persons must be different',
				success: false
			});
		}

		// Fetch primary person details
		const { data: primaryPerson, error: primaryError } = await locals.supabase
			.from('people')
			.select('FirstName, LastName')
			.eq('Auto ID', primaryId)
			.single();

		if (primaryError || !primaryPerson) {
			return fail(404, {
				error: 'Primary person not found',
				success: false
			});
		}

		// Verify secondary person exists
		const { data: secondaryPerson, error: secondaryError } = await locals.supabase
			.from('people')
			.select('FirstName, LastName, "Auto ID"')
			.eq('Auto ID', secondaryId)
			.single();

		if (secondaryError || !secondaryPerson) {
			return fail(404, {
				error: 'Secondary person not found',
				success: false
			});
		}

		// Construct person name
		const personName = `${primaryPerson.FirstName || ''} ${primaryPerson.LastName || ''}`.trim();

		// Count records before updating to get accurate count
		const { count: recordsCount, error: countError } = await locals.supabase
			.from('attendance')
			.select('*', { count: 'exact', head: true })
			.eq('Person Id', secondaryId);

            console.log('recordsCount', recordsCount);
		if (countError) {
			return fail(500, {
				error: `Failed to count attendance records: ${countError.message}`,
				success: false
			});
		}

		// Update all attendance records
		const { error: attendanceError } = await locals.supabase
			.from('attendance')
			.update({
				'Person Id': primaryId,
				'Person Name': personName
			})
			.eq('Person Id', secondaryId);

		if (attendanceError) {
			return fail(500, {
				error: `Failed to merge attendance: ${attendanceError.message}`,
				success: false
			});
		}

		// Use the count from before the update
		const recordsUpdated = recordsCount ?? 0;

		return {
			success: true,
			recordsUpdated,
			secondaryPersonName: `${secondaryPerson.FirstName || ''} ${secondaryPerson.LastName || ''}`.trim(),
			secondaryPersonId: secondaryId
		};
	}
};

