<script lang="ts">
	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
	import Tab, { Label } from '@smui/tab';
	import TabBar from '@smui/tab-bar';
	import type { PageServerData } from './$types';
	import PersonForm from '../../../../../components/PersonForm.svelte';
	import { page } from '$app/stores';
	export let data: PageServerData;

	let stats = data.stats;
</script>

{#if stats}
	<h2>{$page?.params?.serviceId}</h2>
	<h3>From date: {data.fromDate}</h3>
	<h3>To date: {data.toDate}</h3>
	<h2>Total Sessions: {data.stats.length}</h2>
	<DataTable table$aria-label="Attendance list">
		<Head>
			<Row>
				<Cell columnId="name">
					<Label>Name</Label>
				</Cell>
				<Cell columnId="total">
					<Label>Count</Label>
				</Cell>
				<Cell columnId="email">
					<Label>Email</Label>
				</Cell>
			</Row>
		</Head>
		<Body>
			{#each data?.groupedUser as item}
				<Row>
					<Cell>
						{item[0]}
					</Cell>
					<Cell>
						{item[1].length}
					</Cell>
					<Cell>
						{item[1][0].people?.Email}
					</Cell>
				</Row>
			{/each}
		</Body>
	</DataTable>
{/if}
