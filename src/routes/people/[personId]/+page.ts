



import { supabaseClient } from '$lib/supabase'
import { DateTime } from 'luxon';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
    const [peopleData] = await Promise.all([supabaseClient
        .from('people')
        .select(`*`).eq(`Auto ID`, params.personId).single()
    ])

    console.log('people', {peopleData})

    // if (error && status !== 406) throw error

    return {
        person: peopleData?.data
    };
}