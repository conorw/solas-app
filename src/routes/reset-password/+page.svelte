<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);
	/** Set after we either apply hash tokens or confirm an existing session */
	let sessionReady = $state(false);

	/**
	 * `@supabase/ssr` `createBrowserClient` forces `flowType: "pkce"`, but Supabase
	 * recovery emails use implicit-style redirects (`#access_token=...`). GoTrue
	 * then rejects URL detection with "Not a valid PKCE flow url" and never saves
	 * a session — so we parse the hash and call `setSession` ourselves.
	 */
	onMount(async () => {
		const raw = window.location.hash?.replace(/^#/, '') ?? '';
		if (raw) {
			const params = new URLSearchParams(raw);
			const access_token = params.get('access_token');
			const refresh_token = params.get('refresh_token');
			if (access_token && refresh_token) {
				const { error: setErr } = await data.supabase.auth.setSession({
					access_token,
					refresh_token
				});
				if (setErr) {
					error = setErr.message;
					sessionReady = true;
					return;
				}
				window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
				await invalidateAll();
				sessionReady = true;
				return;
			}
		}

		const {
			data: { session }
		} = await data.supabase.auth.getSession();
		if (!session) {
			error =
				'Invalid or expired reset link. Please request a new password reset from the login page.';
		}
		sessionReady = true;
	});

	/**
	 * Recovery tokens live in the URL hash; they are never sent to the server.
	 * Password updates must run in the browser so `updateUser` uses the session.
	 */
	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		if (!sessionReady) return;
		loading = true;
		const { error: err } = await data.supabase.auth.updateUser({ password });
		loading = false;
		if (err) {
			error = err.message;
			return;
		}
		await invalidateAll();
		goto('/');
	}
</script>

<main>
	<h1>Reset Password</h1>
	<form class="auth-form" onsubmit={handleSubmit}>
		<label for="password">New Password</label>
		<input id="password" type="password" name="password" bind:value={password} required autocomplete="new-password" />
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}
		<button type="submit" class="btn btn-primary" disabled={loading || !sessionReady}>
			{loading ? 'Saving…' : !sessionReady ? 'Loading…' : 'Reset'}
		</button>
	</form>
</main>

<style>
	.error {
		color: var(--mdc-theme-error, #b00020);
		margin: 0.5rem 0 0;
	}
</style>
