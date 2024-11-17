import { DateTime } from 'luxon';
import type { PageLoad } from './$types';

export let ssr = false;

export const load: PageLoad = async ({ params, url, data, parent }) => {

	const dt = url.searchParams.get('date') || DateTime.now().toISODate();

	// if (error && status !== 406) throw error

	return {
		date: dt
	};
};
