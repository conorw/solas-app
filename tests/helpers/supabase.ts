import { ANONYMOUS_PERSON_ID } from '../../src/lib/constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './env';

let client: SupabaseClient | null = null;

/** Service-role client for fixture setup/teardown (bypasses RLS). */
export function getServiceClient(): SupabaseClient {
	if (client) return client;
	const url = requireEnv('PUBLIC_SUPABASE_URL');
	const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
	client = createClient(url, key, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
	return client;
}

export function anonymousPersonId(): number {
	return Number(process.env.TEST_ANONYMOUS_PERSON_ID || ANONYMOUS_PERSON_ID);
}
