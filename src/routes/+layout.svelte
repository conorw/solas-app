<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import Button, { Label, Icon as ButtonIcon } from '@smui/button';
	import { Icon } from '@smui/common';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import TopAppBar, { Row, Section } from '@smui/top-app-bar';

	import '../app.postcss';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { page } from '$app/state';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	let title = $state('Solas Attendance Tracker');
	let adminOpen = $state(false);
	let adminWrapEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		title = ['Solas Attendance Tracker', ...page.url.pathname.split('/').slice(1)]
			.filter(Boolean)
			.join(' - ');
	});

	function pathActive(prefix: string) {
		const path = page.url.pathname;
		return path === prefix || path.startsWith(`${prefix}/`);
	}

	const isAttendance = $derived(pathActive('/attendance') || page.url.pathname === '/');
	const isPeople = $derived(pathActive('/people'));
	const isAdmin = $derived(pathActive('/admin'));
	const isAuthRoute = $derived(
		pathActive('/login') || pathActive('/reset-password') || pathActive('/register')
	);
	const showAppBar = $derived(!!data.session && !isAuthRoute);

	const sectionTitle = $derived.by(() => {
		if (isAttendance) return 'Attendance';
		if (isPeople) return 'People';
		if (pathActive('/admin/stats')) return 'Stats';
		if (pathActive('/admin/service')) return 'Services';
		if (pathActive('/admin/people/merge')) return 'Merge';
		if (isAdmin) return 'Admin';
		return 'Solas';
	});

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				refreshAll();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	$effect(() => {
		if (!adminOpen) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!adminWrapEl?.contains(event.target as Node)) {
				adminOpen = false;
			}
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') adminOpen = false;
		};
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});

	$effect(() => {
		page.url.pathname;
		adminOpen = false;
	});

	const submitLogout: SubmitFunction = async ({ cancel }) => {
		const { error } = await data.supabase.auth.signOut();
		if (error) {
			console.log(error);
		}
		cancel();
	};
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

{#if showAppBar}
	<TopAppBar variant="fixed" class="solas-app-bar no-print">
		<Row>
			<Section>
				<a href="/attendance" class="brand" aria-label="Solas home">
					<img src="/logo-1.png" width="28" height="28" alt="" class="brand__logo" />
					<span class="brand__name">Solas</span>
				</a>
				<span class="section-title" aria-hidden="true">{sectionTitle}</span>
			</Section>

			<Section align="end" toolbar class="solas-toolbar">
				<Button
					href="/attendance"
					class="nav-btn {isAttendance ? 'nav-btn--active' : ''}"
					aria-label="Attendance"
					aria-current={isAttendance ? 'page' : undefined}
				>
					<ButtonIcon class="material-icons">event_available</ButtonIcon>
					<Label>Attendance</Label>
				</Button>

				<Button
					href="/people"
					class="nav-btn {isPeople ? 'nav-btn--active' : ''}"
					aria-label="People"
					aria-current={isPeople ? 'page' : undefined}
				>
					<ButtonIcon class="material-icons">people</ButtonIcon>
					<Label>People</Label>
				</Button>

				{#if data?.profile?.isAdmin}
					<div class="admin-wrap" bind:this={adminWrapEl}>
						<Button
							type="button"
							class="nav-btn {isAdmin ? 'nav-btn--active' : ''}"
							aria-label="Admin"
							aria-haspopup="menu"
							aria-expanded={adminOpen}
							onclick={() => (adminOpen = !adminOpen)}
						>
							<ButtonIcon class="material-icons">admin_panel_settings</ButtonIcon>
							<Label>Admin</Label>
							<Icon class="material-icons nav-btn__caret">
								{adminOpen ? 'expand_less' : 'expand_more'}
							</Icon>
						</Button>

						{#if adminOpen}
							<div class="admin-menu" role="menu" aria-label="Admin menu">
								<a
									class="admin-menu__item"
									role="menuitem"
									href="/admin/service"
									onclick={() => (adminOpen = false)}
								>
									<Icon class="material-icons">settings</Icon>
									Services
								</a>
								<a
									class="admin-menu__item"
									role="menuitem"
									href="/admin/stats"
									onclick={() => (adminOpen = false)}
								>
									<Icon class="material-icons">query_stats</Icon>
									Stats
								</a>
								<a
									class="admin-menu__item"
									role="menuitem"
									href="/admin/people/merge"
									onclick={() => (adminOpen = false)}
								>
									<Icon class="material-icons">merge_type</Icon>
									Merge people
								</a>
							</div>
						{/if}
					</div>
				{/if}

				<form action="/logout" method="POST" use:enhance={submitLogout} class="logout-form">
					<Button type="submit" class="nav-btn logout-btn" aria-label="Logout">
						<ButtonIcon class="material-icons">logout</ButtonIcon>
						<Label>Logout</Label>
					</Button>
				</form>
			</Section>
		</Row>
	</TopAppBar>
{/if}

<main class="app-main" class:app-main--with-bar={showAppBar}>
	{@render children?.()}
</main>

<style>
	:global(.solas-app-bar) {
		z-index: 50;
		top: 0;
		left: 0;
	}

	:global(.solas-app-bar .mdc-top-app-bar__row) {
		min-height: 3.5rem;
	}

	:global(.solas-toolbar) {
		gap: 0.25rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-right: 0.75rem;
		padding: 0.25rem 0.35rem;
		border-radius: 6px;
		color: inherit;
		text-decoration: none;
		min-height: 2.75rem;
	}

	.brand:hover,
	.brand:focus-visible {
		background: rgba(255, 255, 255, 0.14);
		outline: none;
	}

	.brand__logo {
		display: block;
		border-radius: 4px;
		background: #fff;
	}

	.brand__name {
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	.section-title {
		font-size: 0.95rem;
		font-weight: 500;
		opacity: 0.85;
		white-space: nowrap;
	}

	@media (max-width: 720px) {
		.section-title {
			display: none;
		}
	}

	:global(.nav-btn) {
		min-height: 2.75rem !important;
		padding-left: 0.65rem !important;
		padding-right: 0.75rem !important;
		color: inherit !important;
		border-radius: 6px !important;
	}

	:global(.nav-btn .mdc-button__label) {
		font-weight: 500;
		text-transform: none;
		letter-spacing: 0.01em;
	}

	:global(.nav-btn--active) {
		background: rgba(255, 255, 255, 0.22) !important;
	}

	:global(.nav-btn__caret) {
		margin-left: 0.1rem;
		font-size: 1.15rem !important;
	}

	.admin-wrap {
		position: relative;
	}

	.admin-menu {
		position: absolute;
		top: calc(100% + 0.35rem);
		right: 0;
		z-index: 60;
		min-width: 13rem;
		padding: 0.4rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: var(--mdc-theme-surface, #fff);
		color: var(--mdc-theme-on-surface, #111);
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
	}

	.admin-menu__item {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-height: 2.75rem;
		padding: 0.45rem 0.75rem;
		border-radius: 6px;
		color: inherit;
		text-decoration: none;
		font-weight: 500;
	}

	.admin-menu__item:hover,
	.admin-menu__item:focus-visible {
		background: color-mix(in srgb, currentColor 10%, transparent);
		outline: none;
	}

	.logout-form {
		display: inline-flex;
		margin: 0;
	}

	:global(.logout-btn) {
		margin-left: 0.15rem;
	}

	.app-main--with-bar {
		padding-top: 3.5rem;
	}

	@media print {
		:global(.no-print) {
			display: none !important;
		}

		.app-main--with-bar {
			padding-top: 0;
		}
	}

	@media (prefers-color-scheme: dark) {
		.admin-menu {
			background: var(--mdc-theme-surface, #212121);
			color: var(--mdc-theme-on-surface, #fff);
			box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
		}
	}

	@media (max-width: 520px) {
		.brand__name {
			display: none;
		}

		:global(.solas-toolbar .nav-btn .mdc-button__label) {
			display: none;
		}

		:global(.solas-toolbar .nav-btn) {
			min-width: 2.75rem;
			padding-left: 0.45rem !important;
			padding-right: 0.45rem !important;
		}

		:global(.nav-btn__caret) {
			display: none;
		}
	}
</style>
