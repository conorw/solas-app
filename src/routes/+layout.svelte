<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import Button, { Label, Icon as ButtonIcon } from '@smui/button';
	import IconButton from '@smui/icon-button';
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
	$effect(() => {
		title = ['Solas Attendance Tracker', ...page.url.pathname.split('/').slice(1)]
			.filter(Boolean)
			.join(' - ');
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
<TopAppBar variant="static">
	<Row>
		<Section>
			<IconButton href="/" aria-label="Home"><Icon class="material-icons">home</Icon></IconButton>
		</Section>
		{#if data.session}
			<Section align="end" toolbar>
				<IconButton href="/people" aria-label="People"
					><Icon class="material-icons">people</Icon></IconButton
				>
				{#if data?.profile?.isAdmin}
					<IconButton href="/admin/service" aria-label="Service"
						><Icon class="material-icons">settings</Icon></IconButton
					>
					<IconButton href="/admin/stats" aria-label="stats"
						><Icon class="material-icons">query_stats</Icon></IconButton
					>
					<IconButton href="/admin/people/merge" aria-label="Merge Persons"
						><Icon class="material-icons">merge_type</Icon></IconButton
					>
				{/if}
				<form action="/logout" method="POST" use:enhance={submitLogout} class="logout-form">
					<Button type="submit" aria-label="Logout">
						<ButtonIcon class="material-icons">logout</ButtonIcon>
						<span class="logout-email">{data?.session?.user?.email}</span>
					</Button>
				</form>
			</Section>
		{/if}
	</Row>
</TopAppBar>

{@render children?.()}

<style>
	.logout-email {
		margin-left: 0.35rem;
		max-width: 12rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 900px) {
		.logout-email {
			display: none;
		}
	}
</style>
