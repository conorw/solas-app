import type { Database } from './supabase';

export type person = Database['public']['Tables']['people']['Row']