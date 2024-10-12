import type { LayoutServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies, url }) => {
	const { session, user } = await safeGetSession()
  
	if (!session?.user && (!url.pathname.includes('login') && !url.pathname.includes('reset-password'))) throw redirect(303, "/login")
	if (url.pathname === '/') throw redirect(302, "/attendance")
	const profile = await (await supabase.from('profiles').select('*').eq('id', session?.user?.id).single()).data;

	if (url.pathname.includes('admin') && (!profile || !profile?.isAdmin)) throw redirect(303, "/attendance")

	return {
		session,
		profile,
		cookies: cookies.getAll()
	}
}
