import type { Database } from './supabase';

export type person = Database['public']['Tables']['people']['Row'];
export type service = Database['public']['Tables']['service']['Row'];
export type attendance = Database['public']['Tables']['attendance']['Row'];
export type profile = Database['public']['Tables']['profiles']['Row'];

/** Attendance row with optional joined people fields from Supabase selects. */
export type attendanceWithPeople = attendance & {
	people?: Pick<person, 'Email' | 'Phone' | 'Marketing Opt Out'> | null;
	email?: string;
};
