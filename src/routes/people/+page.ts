



import { supabaseClient } from '$lib/supabase'
import { DateTime } from 'luxon';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
    const [peopleData] = await Promise.all([supabaseClient
        .from('people')
        .select(`*`),
    ])

    console.log('people', {peopleData})

    // if (error && status !== 406) throw error

    return {
        people: (peopleData?.data?.sort((a, b) =>
        b.FirstName?.toLowerCase() > a.FirstName?.toLowerCase() ? 1 : b.FirstName?.toLowerCase() < a.FirstName?.toLowerCase() ? -1 : 0
    ) || []).reverse()
    };
}