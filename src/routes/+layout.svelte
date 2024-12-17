<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Button from '@smui/button';
	import IconButton from '@smui/icon-button';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import TopAppBar, { Row, Section } from '@smui/top-app-bar';

	import '../app.postcss';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();
	import { page } from '$app/stores';

	let title = $state('Solas Attendance Tracker');
	$effect(() => {
		title = ['Solas Attendance Tracker', ...$page.url.pathname.split('/').slice(1)]
			.filter(Boolean)
			.join(' - ');
	});

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, _session) => {
			if (data.session?.expires_at !== _session?.expires_at) {
				invalidateAll();
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
			<IconButton href="/" class="material-icons" aria-label="Home">home</IconButton>
		</Section>
		{#if data.session}
			<Section align="end" toolbar>
				<IconButton href="/people" class="material-icons" aria-label="People">people</IconButton>
				{#if data?.profile?.isAdmin}
					<IconButton href="/admin/service" class="material-icons" aria-label="Service"
						>settings</IconButton
					>
					<IconButton href="/admin/stats" class="material-icons" aria-label="stats"
						>query_stats</IconButton
					>
				{/if}
				<!-- <IconButton class="material-icons" aria-label="logout">logout</IconButton> -->
				<form action="/logout" method="POST" use:enhance={submitLogout}>
					<Button type="submit">Logout {data?.session?.user?.email}</Button>
				</form>
			</Section>
		{/if}
	</Row>
</TopAppBar>
<!-- <nav class="crumbs">
		<ul>
			<li class="crumb"><a href="/attendance">Attendance Tracker</a></li>
			<li class="crumb"><a href="/reset-password">Reset Password</a></li>
		</ul>
	</nav> -->

{@render children?.()}

<style>
	ul#menu li {
		display: inline;
	}
</style>
