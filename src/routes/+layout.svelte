<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { supabaseClient } from '$lib/supabase';
	import Button, { Icon } from '@smui/button';
	import IconButton from '@smui/icon-button';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';

	export let data: PageData;
	import '../app.postcss';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';

	onMount(() => {
		const {
			data: { subscription }
		} = supabaseClient.auth.onAuthStateChange(() => {
			console.log('Auth state change detected');
			invalidateAll();
		});

		return () => {
			subscription.unsubscribe();
		};
	});
	const submitLogout: SubmitFunction = async ({ cancel }) => {
		const { error } = await supabaseClient.auth.signOut();
		if (error) {
			console.log(error);
		}
		cancel();
	};
</script>

<TopAppBar variant="static">
	<Row>
		<Section>
			<IconButton href="/" class="material-icons" aria-label="Home">home</IconButton>
		</Section>
		{#if data.session}
			<Section align="end" toolbar>
				<IconButton href="/people" class="material-icons" aria-label="People">people</IconButton>
				{#if data?.profile.isAdmin}
					<IconButton href="/admin/service" class="material-icons" aria-label="Service">settings</IconButton>
					<IconButton href="/admin/stats" class="material-icons" aria-label="stats">query_stats</IconButton>
				{/if}
				<!-- <IconButton class="material-icons" aria-label="logout">logout</IconButton> -->
				<form action="/logout" method="POST" use:enhance={submitLogout}>
					<Button type="submit"
						>Logout {data?.session?.user?.email}</Button
					>
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

<slot />

<style>
	ul#menu li {
		display: inline;
	}
</style>
