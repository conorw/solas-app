<script lang="ts">
	import '@carbon/charts-svelte/styles.css';
	import DataTable, { Head, Body, Row, Cell, Label } from '@smui/data-table';
	import Button from '@smui/button';

	import { BarChartSimple } from '@carbon/charts-svelte';
	import DatePicker from '../../../components/DatePicker.svelte';
	import { page } from '$app/stores';
	import { DateTime } from 'luxon';
	import type { PageServerData } from './$types';
	import { goto } from '$app/navigation';
	import { exportData } from '$lib/types/utils';
	interface Props {
		data: PageServerData;
	}

	let { data = $bindable() }: Props = $props();

	let stats = data.stats;
</script>

<DatePicker
	onChange={async (e) => {
		// selectedDate = e;
		if (DateTime.fromJSDate(e).toFormat('yyyy-MM-dd') !== data.fromDate) {
			data.fromDate = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
			$page.url.searchParams.set('fromDate', data.fromDate);
			await goto($page.url.pathname + '?' + $page.url.searchParams.toString(), {
				replaceState: true,
				invalidateAll: true
			});
		}
	}}
	selected={new Date(data.fromDate)}
/>
<DatePicker
	onChange={(e) => {
		// selectedDate = e;
		if (DateTime.fromJSDate(e).toFormat('yyyy-MM-dd') !== data.toDate) {
			data.toDate = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
			$page.url.searchParams.set('toDate', data.toDate);
			goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { invalidateAll: true });
		}
	}}
	selected={new Date(data.toDate)}
/>

<Button
	on:click={async () => {
		const peopleData = await $page.data.supabase.from('people').select('*');

		exportData(peopleData.data, 'people.csv');
	}}
	variant="unelevated"
	class="button-shaped-round"
>
	<Label>Export All User Data</Label>
</Button>
<Button
	on:click={async () => {
		const peopleData = await data.stats;

		exportData(peopleData, 'attendance.csv');
	}}
	variant="unelevated"
	class="button-shaped-round"
>
	<Label>Export Attendance Data</Label>
</Button>

{#if stats}
	<!-- {#each stats as stat}
			<div class="stat">
				<h2>{stat.Date}</h2>
				<p>{stat['Person Name']}</p>
			</div>
		{/each} -->
	<h2>Total Unique People: {data.groupedUser.length}</h2>
	<h2>Total Sessions: {data.stats.length}</h2>
	<h2>Most Popular Service: {data.popularService}</h2>
	<BarChartSimple
		data={data.groupedService?.map((t) => {
			return { group: t[0], value: t[1].length };
		})}
		options={{
			title: 'Totals',
			height: '400px',
			axes: {
				left: { mapsTo: 'value' },
				bottom: { mapsTo: 'group', scaleType: 'labels' }
			}
		}}
	/>
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
					<Cell
						><a
							href={`/admin/stats/services/${item?.[0]}?fromDate=${data.fromDate}&toDate=${data.toDate}`}
							>{item?.[0]}</a
						></Cell
					>
					<Cell>
						{item?.[1].length}
					</Cell>
				</Row>
			{/each}
		</Body>
	</DataTable>
	<DataTable table$aria-label="User list">
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
			{#each data.groupedUser as item}
				<Row>
					<Cell
						><a href={`/admin/stats/people/${item?.[1][0]['Person Id']}`}
							>{item?.[1][0]['Person Name']}</a
						></Cell
					>
					<Cell>
						{item?.[1].length}
					</Cell>
				</Row>
			{/each}
		</Body>
	</DataTable>
	<BarChartSimple
		data={data.groupedByMonth.map((t) => {
			return { group: t[0], value: t[1].length };
		})}
		options={{
			title: 'Totals',
			height: '400px',
			axes: {
				left: { mapsTo: 'value' },
				bottom: { mapsTo: 'group', scaleType: 'labels' }
			}
		}}
	/>
{/if}
