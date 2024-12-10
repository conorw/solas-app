<script lang="ts">
	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
	import { Label } from '@smui/tab';
	import Button from '@smui/button';
	import type { PageServerData } from './$types';
	import { page } from '$app/stores';
	import { exportData } from '$lib/types/utils';
	interface Props {
		data: PageServerData;
	}

	let { data }: Props = $props();

	let stats = data.stats;
</script>

{#if stats}
	<h2>{$page?.params?.serviceId}</h2>
	<h3>From date: {data.fromDate}</h3>
	<h3>To date: {data.toDate}</h3>
	<h4>Total Sessions: {data.stats.length}</h4>
	<Button
		on:click={async () => {
			const peopleData = await data.groupedUser;
			// flatten the data first
			const flatData = peopleData.map((item) => {
				return {
					name: item[0],
					count: item[1].length,
					...item[1][0].people
				};
			});
			exportData(flatData, `${$page?.params?.serviceId}.csv`);
		}}
		variant="unelevated"
		class="button-shaped-round"
	>
		<Label>Export Data</Label>
	</Button>
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
				<Cell columnId="phone">
					<Label>Phone</Label>
				</Cell>
				<Cell columnId="opt">
					<Label>Opt Out</Label>
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
					<Cell>
						{item[1][0].people['Phone']}
					</Cell>
					<Cell>
						{item[1][0].people['Marketing Opt Out']}
					</Cell>
				</Row>
			{/each}
		</Body>
	</DataTable>
{/if}
