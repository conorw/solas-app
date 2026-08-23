<script lang="ts">
	import { goto, refreshAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import Button, { Label } from '@smui/button';
	import Textfield from '@smui/textfield';

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
				window.history.replaceState(
					null,
					'',
					`${window.location.pathname}${window.location.search}`
				);
				await refreshAll();
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
		await refreshAll();
		goto('/');
	}
</script>

<main class="auth-page">
	<div class="auth-card">
		<img src="/logo-1.png" width="72" height="72" alt="Solas" class="auth-logo" />
		<h1>Reset password</h1>
		<p class="auth-subtitle">Choose a new password for your account</p>

		<form class="auth-form" onsubmit={handleSubmit}>
			<Textfield
				class="auth-field"
				id="password"
				type="password"
				name="password"
				label="New Password"
				bind:value={password}
				required
				autocomplete="new-password"
			/>
			{#if error}
				<p class="auth-error" role="alert">{error}</p>
			{/if}
			<Button
				class="auth-submit"
				variant="raised"
				type="submit"
				disabled={loading || !sessionReady}
			>
				<Label>
					{loading ? 'Saving…' : !sessionReady ? 'Loading…' : 'Reset password'}
				</Label>
			</Button>
			<a class="auth-link" href="/login">Back to login</a>
		</form>
	</div>
</main>

<style lang="scss">
	.auth-page {
		min-height: calc(100dvh - 4rem);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem 1rem;
	}

	.auth-card {
		width: min(24rem, 100%);
		padding: 1.75rem 1.5rem 1.5rem;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: var(--mdc-theme-surface, transparent);
		text-align: center;
	}

	.auth-logo {
		display: block;
		margin: 0 auto 0.85rem;
	}

	h1 {
		margin: 0;
		font-size: 1.45rem;
		font-weight: 600;
	}

	.auth-subtitle {
		margin: 0.35rem 0 1.25rem;
		opacity: 0.7;
		font-size: 0.95rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		text-align: left;
	}

	:global(.auth-field),
	:global(.auth-field .mdc-text-field) {
		width: 100%;
	}

	.auth-error {
		margin: 0;
		color: var(--mdc-theme-error, #b00020);
		font-size: 0.9rem;
	}

	:global(.auth-submit) {
		width: 100%;
		min-height: 3rem;
		margin-top: 0.25rem;
	}

	.auth-link {
		display: block;
		text-align: center;
		margin-top: 0.35rem;
		font-size: 0.95rem;
		color: var(--mdc-theme-primary, #40b3ff);
		text-decoration: none;
	}

	.auth-link:hover {
		text-decoration: underline;
	}

	@media (prefers-color-scheme: dark) {
		.auth-card {
			background: var(--mdc-theme-surface, #212121);
		}

		.auth-link {
			color: #7ecbff;
		}
	}
</style>
