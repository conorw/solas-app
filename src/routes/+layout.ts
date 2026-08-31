import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { createBrowserClient, isBrowser } from '@supabase/ssr';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
	depends('supabase:auth');

	if (!isBrowser()) {
		return {
			session: data.session,
			profile: data.profile
		};
	}

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		}
	});

	const {
		data: { session }
	} = await supabase.auth.getSession();

	return {
		supabase,
		session: data.session ?? session,
		profile: data.profile
	};
};
