import type { Database } from './supabase';

export type person = Database['public']['Tables']['people']['Row']
export type service = Database['public']['Tables']['service']['Row']
export type attendance = Database['public']['Tables']['attendance']['Row']