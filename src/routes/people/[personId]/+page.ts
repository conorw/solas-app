



import type { person } from '$lib/types/rows';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url, parent }) => {
    const supabase = (await parent()).supabase;
    const [peopleData] = await Promise.all([supabase
        .from('people')
        .select(`*`).eq(`Auto ID`, params.personId).single()
    ])

    // if (error && status !== 406) throw error

    return {
        person: peopleData?.data as person
    };
}