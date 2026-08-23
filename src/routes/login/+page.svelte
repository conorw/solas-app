<script lang="ts">
	import { preventDefault } from 'svelte/legacy';
	import Button, { Label } from '@smui/button';
	import Textfield from '@smui/textfield';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let info = $state('');
	let loading = $state(false);
	let mode = $state<'login' | 'reset'>('login');

	function showLogin() {
		mode = 'login';
		error = '';
		info = '';
		password = '';
	}

	function showReset() {
		mode = 'reset';
		error = '';
		info = '';
		password = '';
	}

	const submitLogin = async () => {
		error = '';
		info = '';
		loading = true;
		try {
			const formData = new FormData();
			formData.append('email', email.trim());
			formData.append('password', password.trim());
			const res = await fetch('?/login', {
				method: 'POST',
				body: formData,
				headers: { accept: 'application/json' }
			});

			if (res.redirected || res.status === 303 || res.status === 200) {
				const contentType = res.headers.get('content-type') || '';
				if (contentType.includes('application/json')) {
					const data = await res.json();
					if (data.type === 'redirect') {
						window.location.href = data.location || '/';
						return;
					}
					if (data.type === 'failure' || data.type === 'error') {
						const payload = data.data;
						const msg =
							(typeof payload === 'object' && payload && (payload.error || payload.message)) ||
							'Login failed. Check your email and password.';
						error = String(msg);
						password = '';
						return;
					}
				}
				window.location.href = '/';
				return;
			}

			error = 'Login failed. Check your email and password.';
			password = '';
		} catch {
			error = 'Could not reach the server. Try again.';
		} finally {
			loading = false;
		}
	};

	const submitReset = async () => {
		error = '';
		info = '';
		loading = true;
		try {
			const formData = new FormData();
			formData.append('email', email.trim());
			const res = await fetch('?/resetPassword', {
				method: 'POST',
				body: formData,
				headers: { accept: 'application/json' }
			});
			const data = await res.json();
			const payload = data.data;

			if (data.type === 'failure' || data.type === 'error') {
				const msg =
					(typeof payload === 'object' && payload && (payload.error || payload.message)) ||
					'Could not send a reset email.';
				error = String(msg);
				return;
			}

			const message =
				(typeof payload === 'object' && payload && payload.message) ||
				'If an account exists for that email, a password reset link has been sent. Check your inbox.';
			info = String(message);
		} catch {
			error = 'Could not reach the server. Try again.';
		} finally {
			loading = false;
		}
	};
</script>

<main class="auth-page">
	<div class="auth-card">
		<img src="/logo-1.png" width="72" height="72" alt="Solas" class="auth-logo" />
		{#if mode === 'login'}
			<h1>Solas Attendance</h1>
			<p class="auth-subtitle">Sign in to continue</p>

			<form class="auth-form" onsubmit={preventDefault(submitLogin)}>
				<Textfield
					class="auth-field"
					bind:value={email}
					type="email"
					label="Email"
					input$name="email"
					autocomplete="username"
				/>
				<Textfield
					class="auth-field"
					bind:value={password}
					type="text"
					label="Password"
					input$name="password"
					autocomplete="current-password"
				/>
				{#if error}
					<p class="auth-error" role="alert">{error}</p>
				{/if}
				<Button class="auth-submit" variant="raised" type="submit" disabled={loading}>
					<Label>{loading ? 'Signing in…' : 'Login'}</Label>
				</Button>
				<button type="button" class="auth-link" onclick={showReset}>
					Forgot password?
				</button>
			</form>
		{:else}
			<h1>Reset password</h1>
			<p class="auth-subtitle">We’ll email you a link to choose a new password</p>

			<form class="auth-form" onsubmit={preventDefault(submitReset)}>
				<Textfield
					class="auth-field"
					bind:value={email}
					type="email"
					label="Email"
					input$name="email"
					autocomplete="username"
				/>
				{#if error}
					<p class="auth-error" role="alert">{error}</p>
				{/if}
				{#if info}
					<p class="auth-info" role="status">{info}</p>
				{/if}
				<Button class="auth-submit" variant="raised" type="submit" disabled={loading || !!info}>
					<Label>{loading ? 'Sending…' : 'Send reset link'}</Label>
				</Button>
				<button type="button" class="auth-link" onclick={showLogin}>Back to login</button>
			</form>
		{/if}
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

	.auth-info {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.4;
		color: color-mix(in srgb, #2e7d32 80%, currentColor);
	}

	:global(.auth-submit) {
		width: 100%;
		min-height: 3rem;
		margin-top: 0.25rem;
	}

	.auth-link {
		display: block;
		width: 100%;
		margin: 0;
		padding: 0.5rem;
		border: none;
		background: transparent;
		color: var(--mdc-theme-primary, #40b3ff);
		font: inherit;
		font-size: 0.95rem;
		text-align: center;
		cursor: pointer;
		min-height: 2.5rem;
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

		.auth-info {
			color: #81c784;
		}
	}
</style>
