



import { supabaseClient } from '$lib/supabase'
import type { attendance } from '$lib/types/rows';
import { DateTime } from 'luxon';
import type { PageServerLoad } from './$types';

function groupBy(list, keyGetter, sort = true) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return sort ? [...map.entries()].sort((a, b) => b[1].length - a[1].length) : [...map.entries()];
}
export const load: PageServerLoad = async ({ params, url }) => {
    const fromDate: string = url.searchParams.get('fromDate') || DateTime.now().startOf('year').toFormat('yyyy-MM-dd');
    const toDate: string = url.searchParams.get('toDate') || DateTime.now().endOf('year').toFormat('yyyy-MM-dd');
    const [serviceData] = await Promise.all([
        supabaseClient
            .from('attendance')
            .select(`*`).order('Date', { ascending: true })
            .gte('Date', fromDate)
            .lte('Date', toDate)])

    const stats = (serviceData?.data || []) as attendance[];

    const groupedService = groupBy(stats, (stat: { ServiceName: any }) => stat.ServiceName);
    const groupedByMonth = groupBy(
        stats,
        (stat: attendance) => DateTime.fromISO(stat.Date!).monthLong
    );
    const groupedUser = groupBy(stats, (stat: attendance) => stat['Person Id']);

    // console.log(groupedUser);
    const popularService = `${groupedService[0][0]} (${groupedService[0][1].length})`;
    return {
        stats,
        fromDate,
        toDate,
        popularService,
        groupedByMonth,
        groupedUser,
        groupedService
    };
}