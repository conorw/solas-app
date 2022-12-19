<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { supabaseClient } from '$lib/supabase';
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
			<Title><a href="/">Solas Attendance Tracker</a></Title>
		</Section>
		<Section>
			{#if data.session}
				<ul id="menu" >
					<li><a href="/attendance">Attendance Tracker</a></li>
					|
					<li><a href="/people">People</a></li>
					|
					{#if data?.profile.isAdmin}
						<li><a href="/admin/service">Service</a></li>
						|
					{/if}
				</ul>
				<form action="/logout" method="POST" use:enhance={submitLogout}>
					<button type="submit" class="btn btn-primary"
						>Logout {data?.session?.user?.email}</button
					>
				</form>
			{/if}
		</Section>
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
	ul#menu li{
		display : inline;
	}
</style>
