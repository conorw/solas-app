
import type { person } from '$lib/types/rows';
import type { PageLoad } from './$types';
export const load: PageLoad = async (event) => {

    const parent = await event.parent();
    const [peopleData] = await Promise.all([parent.supabase
        .from('people')
        .select(`"Auto ID", "FirstName", "LastName", "DateOfBirth"`),
    ])

    // console.log(peopleData)

    // if (error && status !== 406) throw error

    return {
        people: (peopleData?.data?.sort((a, b) => b.FirstName?.toLowerCase() > a.FirstName?.toLowerCase() ? 1 : b.FirstName?.toLowerCase() < a.FirstName?.toLowerCase() ? -1 : 0
        ) || []).reverse() as unknown as person[]
    };
}