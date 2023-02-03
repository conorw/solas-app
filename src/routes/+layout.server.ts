import { getServerSession } from "@supabase/auth-helpers-sveltekit"
import type { LayoutServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
import { supabaseClient } from '$lib/supabase'
export const load: LayoutServerLoad = async (event) => {

	const session = await getServerSession(event)
	if(!session && (!event.url.pathname.includes('login') && !event.url.pathname.includes('reset-password'))) throw redirect(303, "/login")
	if(event.url.pathname === '/') throw redirect(302, "/attendance")
	const profile = await (await supabaseClient.from('profiles').select('*').eq('id', session?.user?.id).single()).data;
	if(profile && !profile?.isAdmin && !event.url.pathname.includes('admin')) throw redirect(303, "/attendance")

	return {
		session,
		profile,
	}
}
