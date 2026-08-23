<script lang="ts">
	import '@carbon/charts-svelte/styles.css';
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import Button, { Label } from '@smui/button';
	import { BarChartSimple, ScaleTypes, TruncationTypes } from '@carbon/charts-svelte';
	import DatePicker from '../../../components/DatePicker.svelte';
	import { page } from '$app/state';
	import { DateTime } from 'luxon';
	import type { PageServerData } from './$types';
	import { goto } from '$app/navigation';
	import { exportData } from '#lib/types/utils.js';
	import { onMount } from 'svelte';

	interface Props {
		data: PageServerData;
	}

	let { data = $bindable() }: Props = $props();

	let chartTheme = $state<'white' | 'g100'>('white');

	onMount(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const sync = () => {
			chartTheme = mq.matches ? 'g100' : 'white';
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	const serviceChartData = $derived(
		(data.groupedService ?? []).map((t) => ({
			group: String(t[0] ?? 'Unknown'),
			value: t[1].length
		}))
	);

	const monthChartData = $derived(
		(data.groupedByMonth ?? []).map((t) => ({
			group: String(t[0] ?? 'Unknown'),
			value: t[1].length
		}))
	);

	const popularName = $derived(
		data.groupedService?.length ? String(data.groupedService[0][0]) : 'No data'
	);
	const popularCount = $derived(
		data.groupedService?.length ? data.groupedService[0][1].length : 0
	);

	const chartHeight = $derived(
		`${Math.max(280, Math.min(560, 72 + serviceChartData.length * 44))}px`
	);

	const serviceChartOptions = $derived({
		title: 'Sessions by service',
		theme: chartTheme,
		height: chartHeight,
		toolbar: { enabled: false },
		legend: { enabled: false },
		axes: {
			left: {
				mapsTo: 'group',
				scaleType: ScaleTypes.LABELS,
				truncation: { type: TruncationTypes.NONE }
			},
			bottom: { mapsTo: 'value' }
		},
		data: { loading: false }
	});

	const monthChartOptions = $derived({
		title: 'Sessions by month',
		theme: chartTheme,
		height: '360px',
		toolbar: { enabled: false },
		legend: { enabled: false },
		axes: {
			left: { mapsTo: 'value' },
			bottom: {
				mapsTo: 'group',
				scaleType: ScaleTypes.LABELS,
				truncation: { type: TruncationTypes.NONE }
			}
		}
	});

	async function setFromDate(e: Date) {
		const next = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
		if (next === data.fromDate) return;
		data.fromDate = next;
		const fromUrl = new URL(page.url.href);
		fromUrl.searchParams.set('fromDate', data.fromDate);
		await goto(`${fromUrl.pathname}?${fromUrl.searchParams}`, {
			replace: true,
			refreshAll: true
		});
	}

	async function setToDate(e: Date) {
		const next = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
		if (next === data.toDate) return;
		data.toDate = next;
		const toUrl = new URL(page.url.href);
		toUrl.searchParams.set('toDate', data.toDate);
		await goto(`${toUrl.pathname}?${toUrl.searchParams}`, { refreshAll: true });
	}

	async function exportPeople() {
		const peopleData = await page.data.supabase.from('people').select('*');
		exportData(peopleData.data, 'people.csv');
	}

	function exportAttendance() {
		exportData(data.stats, 'attendance.csv');
	}
</script>

<div class="stats-page">
	<header class="stats-toolbar">
		<div class="stats-toolbar__dates">
			<label class="date-field">
				<span class="date-field__label">From</span>
				<DatePicker onChange={setFromDate} selected={new Date(data.fromDate)} />
			</label>
			<label class="date-field">
				<span class="date-field__label">To</span>
				<DatePicker onChange={setToDate} selected={new Date(data.toDate)} />
			</label>
		</div>
		<div class="stats-toolbar__actions">
			<Button onclick={exportPeople} variant="outlined" class="toolbar-btn">
				<Label>Export people</Label>
			</Button>
			<Button onclick={exportAttendance} variant="unelevated" class="toolbar-btn">
				<Label>Export attendance</Label>
			</Button>
		</div>
	</header>

	{#if data.stats?.length}
		<section class="stat-cards" aria-label="Summary">
			<div class="stat-card">
				<span class="stat-card__label">Unique people</span>
				<span class="stat-card__value">{data.groupedUser.length}</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__label">Total sessions</span>
				<span class="stat-card__value">{data.stats.length}</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__label">Most popular service</span>
				<span class="stat-card__value stat-card__value--text">{popularName}</span>
				<span class="stat-card__hint">{popularCount} sessions</span>
			</div>
		</section>

		<section class="chart-panel">
			{#key chartTheme + chartHeight}
				<BarChartSimple data={serviceChartData} options={serviceChartOptions} />
			{/key}
		</section>

		<section class="tables-grid">
			<div class="table-panel">
				<h2 class="table-panel__title">By service</h2>
				<DataTable table$aria-label="Service list" style="width: 100%;">
					<Head>
						<Row>
							<Cell columnId="name"><TableLabel>Name</TableLabel></Cell>
							<Cell columnId="total" numeric><TableLabel>Sessions</TableLabel></Cell>
						</Row>
					</Head>
					<Body>
						{#each data.groupedService as item}
							<Row>
								<Cell>
									<a
										class="table-link"
										href={`/admin/stats/services/${encodeURIComponent(String(item?.[0]))}?fromDate=${data.fromDate}&toDate=${data.toDate}`}
									>
										{item?.[0]}
									</a>
								</Cell>
								<Cell numeric>{item?.[1].length}</Cell>
							</Row>
						{/each}
					</Body>
				</DataTable>
			</div>

			<div class="table-panel">
				<h2 class="table-panel__title">By person</h2>
				<DataTable table$aria-label="User list" style="width: 100%;">
					<Head>
						<Row>
							<Cell columnId="name"><TableLabel>Name</TableLabel></Cell>
							<Cell columnId="total" numeric><TableLabel>Sessions</TableLabel></Cell>
						</Row>
					</Head>
					<Body>
						{#each data.groupedUser as item}
							<Row>
								<Cell>
									<a
										class="table-link"
										href={`/admin/stats/people/${item?.[1][0]['Person Id']}?fromDate=${data.fromDate}&toDate=${data.toDate}`}
									>
										{item?.[1][0]['Person Name']}
									</a>
								</Cell>
								<Cell numeric>{item?.[1].length}</Cell>
							</Row>
						{/each}
					</Body>
				</DataTable>
			</div>
		</section>

		<section class="chart-panel">
			{#key chartTheme}
				<BarChartSimple data={monthChartData} options={monthChartOptions} />
			{/key}
		</section>
	{:else}
		<p class="empty-hint">No attendance in this date range.</p>
	{/if}
</div>

<style lang="scss">
	.stats-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem 1.25rem 2rem;
		max-width: 72rem;
		margin: 0 auto;
	}

	.stats-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		background: var(--mdc-theme-surface, transparent);
	}

	.stats-toolbar__dates {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem 1.25rem;
	}

	.stats-toolbar__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.date-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.date-field__label {
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	:global(.toolbar-btn) {
		min-height: 2.75rem;
	}

	.stat-cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.85rem;
	}

	@media (max-width: 720px) {
		.stat-cards {
			grid-template-columns: 1fr;
		}
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1rem 1.1rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: var(--mdc-theme-surface, transparent);
		min-height: 5.5rem;
	}

	.stat-card__label {
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.stat-card__value {
		font-size: 2rem;
		font-weight: 600;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.stat-card__value--text {
		font-size: 1.2rem;
		font-weight: 600;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.stat-card__hint {
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.chart-panel {
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
	}

	.chart-panel :global(.cds--chart-holder),
	.chart-panel :global(.bx--chart-holder) {
		min-height: 0;
	}

	.tables-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		align-items: start;
	}

	@media (max-width: 840px) {
		.tables-grid {
			grid-template-columns: 1fr;
		}
	}

	.table-panel {
		min-width: 0;
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: var(--mdc-theme-surface, transparent);
		overflow: auto;
	}

	.table-panel__title {
		margin: 0 0 0.65rem;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.table-link {
		color: var(--mdc-theme-primary, #40b3ff);
		text-decoration: none;
		font-weight: 500;
	}

	.table-link:hover,
	.table-link:focus-visible {
		text-decoration: underline;
	}

	@media (prefers-color-scheme: dark) {
		.table-link {
			color: #7ecbff;
		}

		.stats-toolbar,
		.stat-card,
		.table-panel,
		.chart-panel {
			background: var(--mdc-theme-surface, #212121);
		}
	}

	.empty-hint {
		margin: 2rem 0;
		text-align: center;
		opacity: 0.75;
	}
</style>
