import { getServerSession } from "@supabase/auth-helpers-sveltekit"
import type { LayoutServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
export const load: LayoutServerLoad = async (event) => {
	console.log("Ran layout load", event)
	const session = await getServerSession(event)
	if(!session && !event.url.pathname.includes('login')) throw redirect(303, "/login")
	if(event.url.pathname === '/') throw redirect(302, "/attendance")
	return {
		session
	}
}
