import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

function isPath(pathname: string, segment: string) {
	return pathname === `/${segment}` || pathname.startsWith(`/${segment}/`);
}

export const load: LayoutServerLoad = async ({
	locals: { safeGetSession, supabase },
	cookies,
	url
}) => {
	const { session, user } = await safeGetSession();

	const isPublicAuthRoute =
		isPath(url.pathname, 'login') || isPath(url.pathname, 'reset-password');

	if (!user && !isPublicAuthRoute) throw redirect(303, '/login');
	if (url.pathname === '/') throw redirect(302, '/attendance');

	const profile = user?.id
		? (await supabase.from('profiles').select('*').eq('id', user.id).single()).data
		: null;

	if (isPath(url.pathname, 'admin') && (!profile || !profile?.isAdmin)) {
		throw redirect(303, '/attendance');
	}

	return {
		session,
		profile,
		cookies: cookies.getAll()
	};
};
