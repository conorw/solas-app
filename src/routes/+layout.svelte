<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import Button from '@smui/button';
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
		} = data.supabase.auth.onAuthStateChange((_event, _session) => {
			if (data.session?.expires_at !== _session?.expires_at) {
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
				<form action="/logout" method="POST" use:enhance={submitLogout}>
					<Button type="submit">Logout {data?.session?.user?.email}</Button>
				</form>
			</Section>
		{/if}
	</Row>
</TopAppBar>

{@render children?.()}

<style>
	ul#menu li {
		display: inline;
	}
</style>
