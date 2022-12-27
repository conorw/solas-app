<script lang="ts">
	import '@carbon/styles/css/styles.css';
	import '@carbon/charts/styles.css';
	import { BarChartSimple } from '@carbon/charts-svelte';
	import DatePicker from '../../../components/DatePicker.svelte';
	import { page } from '$app/stores';
	import { DateTime } from 'luxon';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import Tab, { Label } from '@smui/tab';
	import TabBar from '@smui/tab-bar';
	import type { attendance } from '$lib/types/rows';
	export let data: PageData;
	let active = 'All';
	let stats = data.stats;
	function groupBy(list, keyGetter, sort=true) {
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
	let groupedByMonth = groupBy(data.stats, (stat: attendance) => DateTime.fromISO(stat.Date!).monthLong);
	let groupedUser = groupBy(data.stats, (stat: attendance) => stat['Person Id']);
	// console.log(groupedService.values());
	let popularService = `${groupedService[0][0]} (${groupedService[0][1].length})`;
</script>

<DatePicker
	onChange={(e) => {
		// selectedDate = e;
		if (DateTime.fromJSDate(e).toFormat('yyyy-MM-dd') !== data.fromDate) {
			console.log(e);
			data.fromDate = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
			$page.url.searchParams.set('fromDate', data.fromDate);
			goto($page.url.pathname + '?' + $page.url.searchParams.toString(), { replaceState: true });
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
<TabBar tabs={['All', 'By Service', 'By Person']} let:tab bind:active>
	<!-- Note: the `tab` property is required! -->
	<Tab {tab}>
		<Label>{tab}</Label>
	</Tab>
</TabBar>
{#if stats}
	{#if active === 'All'}
		<!-- {#each stats as stat}
			<div class="stat">
				<h2>{stat.Date}</h2>
				<p>{stat['Person Name']}</p>
			</div>
		{/each} -->
		Total Unique People: {groupedUser.length}
		Total Sessions: {data.stats.length}
		Most Popular Service: {popularService}
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
	{#if active === 'By Service'}
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
	{/if}
	{#if active === 'By Person'}{/if}
{/if}
