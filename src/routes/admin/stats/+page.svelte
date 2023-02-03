<script lang="ts">
	import '@carbon/styles/css/styles.css';
	import '@carbon/charts/styles.css';
	import DataTable, { Head, Body, Row, Cell, Label } from '@smui/data-table';

	import { BarChartSimple } from '@carbon/charts-svelte';
	import DatePicker from '../../../components/DatePicker.svelte';
	import { page } from '$app/stores';
	import { DateTime } from 'luxon';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import type { attendance } from '$lib/types/rows';
	export let data: PageData;

	let stats = data.stats;
	function groupBy(list, keyGetter, sort = true) {
		const map = new Map();
		list.forEach((item) => {
			const key = keyGetter(item);
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [item]);
			} else {
				collection.push(item);
			}
		});
		return sort ? [...map.entries()].sort((a, b) => b[1].length - a[1].length) : [...map.entries()];
	}
	let groupedService = groupBy(data.stats, (stat: { ServiceName: any }) => stat.ServiceName);
	let groupedByMonth = groupBy(
		data.stats,
		(stat: attendance) => DateTime.fromISO(stat.Date!).monthLong
	);
	let groupedUser = groupBy(data.stats, (stat: attendance) => stat['Person Id']);

	console.log(groupedUser);
	let popularService = `${groupedService[0][0]} (${groupedService[0][1].length})`;
</script>

<DatePicker
	onChange={async (e) => {
		// selectedDate = e;
		if (DateTime.fromJSDate(e).toFormat('yyyy-MM-dd') !== data.fromDate) {
			console.log(e);
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
			console.log(e);
			data.toDate = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
			$page.url.searchParams.set('toDate', data.toDate);
			goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { invalidateAll: true });
		}
	}}
	selected={new Date(data.toDate)}
/>

{#if stats}
	<!-- {#each stats as stat}
			<div class="stat">
				<h2>{stat.Date}</h2>
				<p>{stat['Person Name']}</p>
			</div>
		{/each} -->
	<h2>Total Unique People: {groupedUser.length}</h2>
	<h2>Total Sessions: {data.stats.length}</h2>
	<h2>Most Popular Service: {popularService}</h2>
	<BarChartSimple
		data={groupedService.map((t) => {
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
			{#each groupedService as item}
				<Row>
					<Cell>{item?.[0]}</Cell>
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
			{#each groupedUser as item}
				<Row>
					<Cell><a target="_blank" href={`/people/${item?.[1][0]['Person Id']}`}>{item?.[1][0]['Person Name']}</a></Cell>
					<Cell>
						{item?.[1].length}
					</Cell>
				</Row>
			{/each}
		</Body>
	</DataTable>
	<BarChartSimple
		data={groupedByMonth.map((t) => {
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
