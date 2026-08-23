<script lang="ts">
	import Button, { Label } from '@smui/button';
	import Textfield from '@smui/textfield';
	import { enhance } from '$app/forms';

	let error = $state('');
</script>

<main class="auth-page">
	<div class="auth-card">
		<img src="/logo-1.png" width="72" height="72" alt="Solas" class="auth-logo" />
		<h1>Register</h1>
		<p class="auth-subtitle">Create an account</p>

		<form
			action="?/register"
			method="POST"
			class="auth-form"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						error = (result.data as { error?: string })?.error || 'Registration failed.';
					} else if (result.type === 'success') {
						error = '';
						window.location.href = '/';
					}
					await update({ reset: false });
				};
			}}
		>
			<Textfield
				class="auth-field"
				type="email"
				name="email"
				input$name="email"
				label="Email"
				autocomplete="username"
			/>
			<Textfield
				class="auth-field"
				type="password"
				name="password"
				input$name="password"
				label="Password"
				autocomplete="new-password"
			/>
			{#if error}
				<p class="auth-error" role="alert">{error}</p>
			{/if}
			<Button class="auth-submit" variant="raised" type="submit">
				<Label>Register</Label>
			</Button>
			<a class="auth-link" href="/login">Already have an account? Login</a>
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
