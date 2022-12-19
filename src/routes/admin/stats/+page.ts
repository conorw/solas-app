



import { supabaseClient } from '$lib/supabase'
import type { attendance, service } from '$lib/types/rows';
import { DateTime } from 'luxon';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
    const fromDate: string = url.searchParams.get('fromDate') || DateTime.now().startOf('year').toFormat('yyyy-MM-dd');
    const toDate: string = url.searchParams.get('toDate') || DateTime.now().endOf('year').toFormat('yyyy-MM-dd');
    const [serviceData] = await Promise.all([
    supabaseClient
        .from('attendance')
        .select(`*`).order('Date', { ascending: true })
        .gte('Date', fromDate)
        .lte('Date', toDate)])

        console.log('service', {serviceData: serviceData.data?.length, fromDate, toDate})
    return {
        stats: (serviceData?.data || []) as attendance[],
        fromDate,
        toDate
    };
}