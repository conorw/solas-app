



import { supabaseClient } from '$lib/supabase'
import type { service } from '$lib/types/rows';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
    const [serviceData] = await Promise.all([
    supabaseClient
        .from('service')
        .select(`*`)
        .order('Name', { ascending: true })])


    return {
        service: (serviceData?.data || []) as service[]
    };
}