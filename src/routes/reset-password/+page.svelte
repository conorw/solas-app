<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	/**
	 * Recovery tokens live in the URL hash; they are never sent to the server.
	 * Password updates must run in the browser so `updateUser` uses the session
	 * established from that hash (see @supabase/ssr browser client in +layout.ts).
	 */
	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
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
		<button type="submit" class="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Reset'}</button>
	</form>
</main>

<style>
	.error {
		color: var(--mdc-theme-error, #b00020);
		margin: 0.5rem 0 0;
	}
</style>
