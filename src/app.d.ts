// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

import type { TypedSupabaseClient } from "@supabase/auth-helpers-sveltekit/dist/types"
import type { Session } from "@supabase/supabase-js"

declare global {
	declare namespace App {
		// interface Error {}
		interface Locals {
			supabase: TypedSupabaseClient
			getSession: () => Promise<Session | null>
			safeGetSession: () => Promise<{ session: Session | null, user: any | null }>
		}
		interface PageData {
			session: import("@supabase/supabase-js").Session | null
		}

		interface Supabase {
			Database: import('./src/types/supabase').Database;
			SchemaName: 'public';
		}

		// interface Platform {}
	}
}
