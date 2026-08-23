import { AuthApiError } from '@supabase/supabase-js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	register: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) {
			error(403, 'Registration is closed');
		}

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('isAdmin')
			.eq('id', user.id)
			.single();

		if (!profile?.isAdmin) {
			error(403, 'Only admins can register new users');
		}

		const body = Object.fromEntries(await request.formData());

		const { error: err } = await locals.supabase.auth.signUp({
			email: body.email as string,
			password: body.password as string
		});

		if (err) {
			if (err instanceof AuthApiError && err.status === 400) {
				return fail(400, {
					error: 'Invalid email or password'
				});
			}
			return fail(500, {
				error: 'Server error. Please try again later.'
			});
		}

		redirect(303, '/');
	}
};
