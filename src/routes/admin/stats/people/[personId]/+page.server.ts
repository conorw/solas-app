


import type { attendance, person } from '$lib/types/rows';
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
export const load: PageServerLoad = async ({ params, url, locals }) => {
    const personId: string = params.personId;
    const [serviceData, peopleData] = await Promise.all([
        locals.supabase
            .from('attendance')
            .select(`*`).order('Date', { ascending: false })
            .eq('Person Id', personId),
        locals.supabase
            .from('people')
            .select(`*`).eq(`Auto ID`, params.personId).single()])

    const stats = (serviceData?.data || []) as attendance[];

    const groupedService = groupBy(stats, (stat: { ServiceName: any }) => stat.ServiceName);
    const groupedByMonth = groupBy(
        stats,
        (stat: attendance) => DateTime.fromISO(stat.Date!).monthLong
    );
    // console.log(groupedUser);
    const popularService = `${groupedService[0][0]} (${groupedService[0][1].length})`;
    return {
        stats,
        popularService,
        groupedByMonth,
        groupedService,
        personId,
        person: peopleData?.data as person
    };
}