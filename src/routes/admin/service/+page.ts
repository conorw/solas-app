



import type { service } from '$lib/types/rows';
import type { PageLoad } from './$types';

export const load: PageLoad = async (event) => {

    const supabase = (await event.parent()).supabase;
    const [serviceData] = await Promise.all([
        supabase
            .from('service')
            .select(`*`)
            .order('Name', { ascending: true })])

    return {
        service: (serviceData?.data || []) as service[]
    };
}