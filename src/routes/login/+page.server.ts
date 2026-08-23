import { AuthApiError } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const body = Object.fromEntries(await request.formData());

		const { error: err } = await locals.supabase.auth.signInWithPassword({
			email: body.email as string,
			password: body.password as string
		});

		if (err) {
			if (err instanceof AuthApiError && err.status === 400) {
				return fail(400, {
					error: 'Invalid credentials'
				});
			}
			return fail(500, {
				message: 'Server error. Try again later.'
			});
		}

		throw redirect(303, '/');
	},

	resetPassword: async ({ request, locals, url }) => {
		const body = Object.fromEntries(await request.formData());
		const email = String(body.email ?? '').trim();

		if (!email) {
			return fail(400, { error: 'Enter the email address for your account.' });
		}

		const redirectTo = `${url.origin}/reset-password`;
		const { error: err } = await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo
		});

		if (err) {
			return fail(400, {
				error: err.message || 'Could not send a reset email. Try again later.'
			});
		}

		return {
			success: true,
			message: 'If an account exists for that email, a password reset link has been sent. Check your inbox.'
		};
	}
};
