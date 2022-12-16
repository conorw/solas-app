



import { supabaseClient } from '$lib/supabase'
import { DateTime } from 'luxon';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
    const dt = url.searchParams.get('date') || DateTime.now().toISODate();
    const [peopleData, serviceData] = await Promise.all([supabaseClient
        .from('people')
        .select(`Id, "LastName", "FirstName", "DateOfBirth", "Acupuncture Data"`)
        .order('FirstName', { ascending: true }),
    supabaseClient
        .from('service')
        .select(`Name, "Auto ID"`).eq(`Is Current`, true)
        .order('Name', { ascending: true })])

        console.log('service', {serviceData})
    // if (error && status !== 406) throw error

    return {
        people: peopleData?.data || [],
        service: serviceData?.data || [], date: dt
    };
}