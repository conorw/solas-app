<script lang="ts">
	import '@carbon/charts-svelte/styles.css';
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import Button, { Label } from '@smui/button';
	import Checkbox from '@smui/checkbox';
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import FormField from '@smui/form-field';
	import { BarChartSimple, ScaleTypes, TruncationTypes } from '@carbon/charts-svelte';
	import DatePicker from '../../../components/DatePicker.svelte';
	import { page } from '$app/state';
	import { DateTime } from 'luxon';
	import type { PageServerData } from './$types';
	import { goto } from '$app/navigation';
	import { exportData } from '#lib/types/utils.js';
	import { onMount, tick } from 'svelte';

	type PdfSectionKey =
		| 'summary'
		| 'serviceChart'
		| 'byService'
		| 'byPerson'
		| 'monthChart'
		| 'whoAttended'
		| 'referral';

	const PDF_SECTION_OPTIONS: { key: PdfSectionKey; label: string }[] = [
		{ key: 'summary', label: 'Summary cards' },
		{ key: 'serviceChart', label: 'Sessions by service chart' },
		{ key: 'byService', label: 'By service table' },
		{ key: 'byPerson', label: 'By person table' },
		{ key: 'monthChart', label: 'Sessions by month chart' },
		{ key: 'whoAttended', label: 'Who attended' },
		{ key: 'referral', label: 'Referral & support' }
	];

	function defaultPdfSections(): Record<PdfSectionKey, boolean> {
		return {
			summary: true,
			serviceChart: true,
			byService: true,
			byPerson: true,
			monthChart: true,
			whoAttended: true,
			referral: true
		};
	}

	interface Props {
		data: PageServerData;
	}

	let { data = $bindable() }: Props = $props();

	let preferredChartTheme = $state<'white' | 'g100'>('white');
	let chartTheme = $state<'white' | 'g100'>('white');
	let pdfDialogOpen = $state(false);
	let pdfSections = $state(defaultPdfSections());
	let isPrinting = $state(false);
	const generatedOn = $derived(DateTime.now().toFormat('d MMM yyyy'));
	const hasWhoAttended = $derived(!!(data.whoAttended && data.whoAttended.uniqueNamed > 0));
	const pdfHasSelection = $derived(Object.values(pdfSections).some(Boolean));

	function omitSection(key: PdfSectionKey) {
		return isPrinting && !pdfSections[key];
	}
	onMount(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const sync = () => {
			preferredChartTheme = mq.matches ? 'g100' : 'white';
			chartTheme = preferredChartTheme;
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

	function countChartData(rows: { label: string; count: number }[] | undefined) {
		return (rows ?? []).map((r) => ({ group: r.label, value: r.count }));
	}

	function horizontalBarOptions(title: string, rows: { label: string; count: number }[]) {
		const height = `${Math.max(220, Math.min(480, 64 + rows.length * 40))}px`;
		return {
			title,
			theme: chartTheme,
			height,
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
		};
	}

	const who = $derived(data.whoAttended);
	const ageChartData = $derived(countChartData(who?.ageBands));
	const genderChartData = $derived(countChartData(who?.gender));
	const townChartData = $derived(countChartData(who?.town));
	const referralChartData = $derived(countChartData(who?.referralSource));
	const otherSupportChartData = $derived(countChartData(who?.otherSupport));

	const ageChartOptions = $derived(horizontalBarOptions('Age bands', who?.ageBands ?? []));
	const genderChartOptions = $derived(horizontalBarOptions('Gender', who?.gender ?? []));
	const townChartOptions = $derived(horizontalBarOptions('Town', who?.town ?? []));
	const referralChartOptions = $derived(
		horizontalBarOptions('Referral source', who?.referralSource ?? [])
	);
	const otherSupportChartOptions = $derived(
		horizontalBarOptions('Other support', who?.otherSupport ?? [])
	);

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

	function openPdfDialog() {
		if (!data.stats?.length) return;
		pdfSections = defaultPdfSections();
		pdfDialogOpen = true;
	}

	async function confirmPdfExport() {
		if (!data.stats?.length || !pdfHasSelection) return;
		pdfDialogOpen = false;

		const previousTitle = document.title;
		document.title = `Solas stats ${data.fromDate} to ${data.toDate}`;
		chartTheme = 'white';
		isPrinting = true;
		await tick();

		const restore = () => {
			document.title = previousTitle;
			chartTheme = preferredChartTheme;
			isPrinting = false;
			window.removeEventListener('afterprint', restore);
		};
		window.addEventListener('afterprint', restore);

		requestAnimationFrame(() => {
			window.print();
		});
	}
</script>

<div class="stats-page">
	<header class="print-report-header">
		<div class="print-report-header__brand">
			<img src="/logo-1.png" width="40" height="40" alt="" class="print-report-header__logo" />
			<div>
				<p class="print-report-header__name">Solas</p>
				<p class="print-report-header__title">Attendance statistics</p>
			</div>
		</div>
		<div class="print-report-header__meta">
			<p>Period: {data.fromDate} – {data.toDate}</p>
			<p>Generated: {generatedOn}</p>
		</div>
	</header>

	<header class="stats-toolbar no-print">
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
			<Button onclick={exportAttendance} variant="outlined" class="toolbar-btn">
				<Label>Export attendance</Label>
			</Button>
			<Button
				type="button"
				onclick={openPdfDialog}
				variant="unelevated"
				class="toolbar-btn"
				disabled={!data.stats?.length}
			>
				<Label>Export PDF</Label>
			</Button>
		</div>
	</header>

	{#if data.stats?.length}
		<section
			class="stat-cards"
			class:pdf-omit={omitSection('summary')}
			aria-label="Summary"
		>
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

		<section class="chart-panel" class:pdf-omit={omitSection('serviceChart')}>
			{#key chartTheme + chartHeight}
				<BarChartSimple data={serviceChartData} options={serviceChartOptions} />
			{/key}
		</section>

		<section class="tables-grid">
			<div class="table-panel" class:pdf-omit={omitSection('byService')}>
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

			<div class="table-panel" class:pdf-omit={omitSection('byPerson')}>
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

		<section class="chart-panel" class:pdf-omit={omitSection('monthChart')}>
			{#key chartTheme}
				<BarChartSimple data={monthChartData} options={monthChartOptions} />
			{/key}
		</section>

		{#if who && who.uniqueNamed > 0}
			<section
				class="section-block"
				class:pdf-omit={omitSection('whoAttended')}
				aria-labelledby="who-attended-heading"
			>
				<h2 id="who-attended-heading" class="section-block__title">Who attended</h2>
				<p class="section-block__lede">
					Unique named people in this range ({who.uniqueNamed}), excluding anonymous multi
					sessions.
				</p>

				<div class="stat-cards stat-cards--five">
					<div class="stat-card">
						<span class="stat-card__label">Carers</span>
						<span class="stat-card__value">{who.carers}</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Disability</span>
						<span class="stat-card__value">{who.disability}</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Marketing reachable</span>
						<span class="stat-card__value">{who.marketingReachable}</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Marketing opt out</span>
						<span class="stat-card__value">{who.marketingOptOut}</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Named people</span>
						<span class="stat-card__value">{who.uniqueNamed}</span>
					</div>
				</div>

				<div class="charts-grid">
					<section class="chart-panel">
						{#key chartTheme + 'age'}
							<BarChartSimple data={ageChartData} options={ageChartOptions} />
						{/key}
					</section>
					<section class="chart-panel">
						{#key chartTheme + 'gender'}
							<BarChartSimple data={genderChartData} options={genderChartOptions} />
						{/key}
					</section>
					<section class="chart-panel chart-panel--wide">
						{#key chartTheme + 'town'}
							<BarChartSimple data={townChartData} options={townChartOptions} />
						{/key}
					</section>
				</div>
			</section>

			<section
				class="section-block"
				class:pdf-omit={omitSection('referral')}
				aria-labelledby="referral-heading"
			>
				<h2 id="referral-heading" class="section-block__title">Referral & support</h2>
				<p class="section-block__lede">
					How named attendees said they heard about Solas, and other support they receive.
				</p>

				<div class="stat-cards">
					<div class="stat-card">
						<span class="stat-card__label">Referral not set</span>
						<span class="stat-card__value">{who.referralBlank}</span>
						<span class="stat-card__hint">
							of {who.uniqueNamed} named people
						</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Other support not set</span>
						<span class="stat-card__value">{who.otherSupportBlank}</span>
						<span class="stat-card__hint">
							of {who.uniqueNamed} named people
						</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Has referral source</span>
						<span class="stat-card__value"
							>{who.uniqueNamed - who.referralBlank}</span
						>
					</div>
				</div>

				<div class="charts-grid">
					<section class="chart-panel">
						{#key chartTheme + 'referral'}
							<BarChartSimple data={referralChartData} options={referralChartOptions} />
						{/key}
					</section>
					<section class="chart-panel">
						{#key chartTheme + 'support'}
							<BarChartSimple
								data={otherSupportChartData}
								options={otherSupportChartOptions}
							/>
						{/key}
					</section>
				</div>
			</section>
		{/if}
	{:else}
		<p class="empty-hint">No attendance in this date range.</p>
	{/if}
</div>

<Dialog
	bind:open={pdfDialogOpen}
	aria-labelledby="pdf-export-title"
	aria-describedby="pdf-export-content"
>
	<Title id="pdf-export-title">Export PDF</Title>
	<Content id="pdf-export-content">
		<p class="pdf-dialog-lede">Choose which sections to include in the PDF.</p>
		<div class="pdf-section-list">
			{#each PDF_SECTION_OPTIONS as option (option.key)}
				<FormField>
					<Checkbox
						checked={pdfSections[option.key]}
						disabled={
							(option.key === 'whoAttended' || option.key === 'referral') &&
							!hasWhoAttended
						}
						onclick={() => {
							if (
								(option.key === 'whoAttended' || option.key === 'referral') &&
								!hasWhoAttended
							) {
								return;
							}
							pdfSections[option.key] = !pdfSections[option.key];
						}}
					/>
					{#snippet label()}{option.label}{/snippet}
				</FormField>
			{/each}
		</div>
	</Content>
	<Actions>
		<Button onclick={() => (pdfDialogOpen = false)}>
			<Label>Cancel</Label>
		</Button>
		<Button
			onclick={confirmPdfExport}
			action="accept"
			variant="raised"
			disabled={!pdfHasSelection}
		>
			<Label>Export PDF</Label>
		</Button>
	</Actions>
</Dialog>

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

	.section-block {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.section-block__title {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.section-block__lede {
		margin: 0;
		font-size: 0.95rem;
		opacity: 0.75;
		max-width: 40rem;
	}

	.stat-cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.85rem;
	}

	.stat-cards--five {
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.chart-panel--wide {
		grid-column: 1 / -1;
	}

	@media (max-width: 840px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 900px) {
		.stat-cards--five {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 720px) {
		.stat-cards,
		.stat-cards--five {
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

	.print-report-header {
		display: none;
	}

	.pdf-dialog-lede {
		margin: 0 0 0.85rem;
		opacity: 0.8;
	}

	.pdf-section-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	@media print {
		:global(.no-print) {
			display: none !important;
		}

		.pdf-omit {
			display: none !important;
		}

		.stats-page {
			max-width: none;
			margin: 0;
			padding: 0;
			gap: 1rem;
			color: #111;
			background: #fff;
		}

		.print-report-header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 1rem;
			padding-bottom: 0.85rem;
			margin-bottom: 0.25rem;
			border-bottom: 1px solid #ccc;
		}

		.print-report-header__brand {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

		.print-report-header__logo {
			display: block;
			border-radius: 4px;
		}

		.print-report-header__name,
		.print-report-header__title,
		.print-report-header__meta p {
			margin: 0;
		}

		.print-report-header__name {
			font-size: 1.25rem;
			font-weight: 700;
		}

		.print-report-header__title {
			font-size: 1rem;
			font-weight: 500;
			opacity: 0.8;
		}

		.print-report-header__meta {
			text-align: right;
			font-size: 0.9rem;
			line-height: 1.45;
		}

		.stat-card,
		.chart-panel,
		.table-panel,
		.section-block {
			break-inside: avoid;
			page-break-inside: avoid;
			background: #fff;
			border-color: #ccc;
		}

		.table-link {
			color: inherit;
			text-decoration: none;
			font-weight: 500;
		}

		.tables-grid,
		.charts-grid,
		.stat-cards,
		.stat-cards--five {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.stat-cards--five {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.chart-panel--wide {
			grid-column: 1 / -1;
		}
	}
</style>
