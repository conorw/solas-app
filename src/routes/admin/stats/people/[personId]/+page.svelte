<script lang="ts">
	// import '@carbon/styles/css/styles.css';
	// import '@carbon/charts/styles.css';
	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
	import Tab, { Label } from '@smui/tab';
	import TabBar from '@smui/tab-bar';
	import type { PageServerData } from './$types';
	import PersonForm from '../../../../../components/PersonForm.svelte';
	import { page } from '$app/stores';
	interface Props {
		data: PageServerData;
	}

	let { data }: Props = $props();

	let stats = data.stats;
	let active = $state('Stats');
</script>

{#if stats}
	<!-- {#each stats as stat}
			<div class="stat">
				<h2>{stat.Date}</h2>
				<p>{stat['Person Name']}</p>
			</div>
		{/each} -->

	<h2>{data.person['Full Name']}</h2>
	<TabBar tabs={['Stats', 'details']}  bind:active>
		{#snippet children({ tab })}
				<!-- Note: the `tab` property is required! -->
			<Tab {tab}>
				<Label>{tab}</Label>
			</Tab>
					{/snippet}
		</TabBar>

	{#if active === 'Stats'}
		<h2>Total Sessions: {data.stats.length}</h2>
		<h2>Most Popular Service: {data.popularService}</h2>
		<h2>Latest Session: {data.stats[data.stats.length - 1].Date}</h2>
		<h2>First Session: {data.stats[0].Date}</h2>
		<DataTable table$aria-label="Attendance list">
			<Head>
				<Row>
					<Cell columnId="name">
						<Label>Name</Label>
					</Cell>
					<Cell columnId="total">
						<Label>Sessions</Label>
					</Cell>
				</Row>
			</Head>
			<Body>
				{#each stats as item}
					<Row>
						<Cell>{item?.Date}</Cell>
						<Cell>
							{item?.ServiceName}
						</Cell>
					</Row>
				{/each}
			</Body>
		</DataTable>
		<DataTable table$aria-label="Service list">
			<Head>
				<Row>
					<Cell columnId="name">
						<Label>Name</Label>
					</Cell>
					<Cell columnId="total">
						<Label>Sessions</Label>
					</Cell>
				</Row>
			</Head>
			<Body>
				{#each data.groupedService as item}
					<Row>
						<Cell>{item?.[0]}</Cell>
						<Cell>
							{item?.[1].length}
						</Cell>
					</Row>
				{/each}
			</Body>
		</DataTable>
	{/if}
	{#if active === 'details'}
		<PersonForm
			supabase={$page.data.supabase}
			onSave={() => history.back()}
			person={data?.person}
		/>
	{/if}
{/if}
