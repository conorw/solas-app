



import { supabaseClient } from '$lib/supabase'
import type { person } from '$lib/types/rows';
import { DateTime } from 'luxon';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
    const [peopleData] = await Promise.all([supabaseClient
        .from('people')
        .select(`"Auto ID", "FirstName", "LastName", "DateOfBirth"`),
    ])

    // if (error && status !== 406) throw error

    return {
        people: (peopleData?.data?.sort((a, b) => b.FirstName?.toLowerCase() > a.FirstName?.toLowerCase() ? 1 : b.FirstName?.toLowerCase() < a.FirstName?.toLowerCase() ? -1 : 0
        ) || []).reverse() as unknown as person[]
    };
}