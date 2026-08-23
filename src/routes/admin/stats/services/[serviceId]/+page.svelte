<script lang="ts">
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import Button, { Icon, Label } from '@smui/button';
	import type { PageServerData } from './$types';
	import { page } from '$app/state';
	import { exportData } from '#lib/types/utils.js';

	interface Props {
		data: PageServerData;
	}

	let { data }: Props = $props();

	const serviceName = $derived(decodeURIComponent(page.params.serviceId ?? 'Service'));
	const statsHref = $derived(
		`/admin/stats?fromDate=${data.fromDate}&toDate=${data.toDate}`
	);

	function exportUsers() {
		const flatData = (data.groupedUser ?? []).map((item) => {
			const people = item[1][0]?.people;
			return {
				name: item[0],
				count: item[1].length,
				Email: people?.Email ?? '',
				Phone: people?.Phone ?? '',
				'Marketing Opt Out': people?.['Marketing Opt Out'] ?? ''
			};
		});
		exportData(flatData, `${serviceName}.csv`);
	}
</script>

<div class="service-stats">
	<header class="service-stats__header">
		<Button href={statsHref} variant="outlined" class="back-btn">
			<Icon class="material-icons">arrow_back</Icon>
			<Label>Stats</Label>
		</Button>
		<div class="service-stats__titles">
			<h1>{serviceName}</h1>
			<p class="date-range">{data.fromDate} → {data.toDate}</p>
		</div>
		<Button onclick={exportUsers} variant="unelevated" class="export-btn">
			<Icon class="material-icons">download</Icon>
			<Label>Export</Label>
		</Button>
	</header>

	{#if data.stats?.length}
		<section class="stat-cards" aria-label="Summary">
			<div class="stat-card">
				<span class="stat-card__label">Total sessions</span>
				<span class="stat-card__value">{data.stats.length}</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__label">Unique people</span>
				<span class="stat-card__value">{data.groupedUser?.length ?? 0}</span>
			</div>
		</section>

		<div class="table-panel">
			<h2 class="table-panel__title">Attendees</h2>
			<DataTable table$aria-label="Attendance list" style="width: 100%;">
				<Head>
					<Row>
						<Cell columnId="name"><TableLabel>Name</TableLabel></Cell>
						<Cell columnId="total" numeric><TableLabel>Count</TableLabel></Cell>
						<Cell columnId="email"><TableLabel>Email</TableLabel></Cell>
						<Cell columnId="phone"><TableLabel>Phone</TableLabel></Cell>
						<Cell columnId="opt"><TableLabel>Marketing opt out</TableLabel></Cell>
					</Row>
				</Head>
				<Body>
					{#each data.groupedUser as item}
						<Row>
							<Cell>{item[0]}</Cell>
							<Cell numeric>{item[1].length}</Cell>
							<Cell>{item[1][0].people?.Email ?? '—'}</Cell>
							<Cell>{item[1][0].people?.Phone ?? '—'}</Cell>
							<Cell>
								{item[1][0].people?.['Marketing Opt Out'] ? 'Yes' : 'No'}
							</Cell>
						</Row>
					{/each}
				</Body>
			</DataTable>
		</div>
	{:else}
		<div class="empty-state">
			<p>No attendance for this service in the selected date range.</p>
			<Button href={statsHref} variant="outlined">
				<Label>Back to stats</Label>
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	.service-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 1.25rem 2rem;
		max-width: 72rem;
		margin: 0 auto;
	}

	.service-stats__header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
	}

	.service-stats__titles {
		flex: 1;
		min-width: 12rem;

		h1 {
			margin: 0;
			font-size: 1.45rem;
			font-weight: 600;
			overflow-wrap: anywhere;
		}
	}

	.date-range {
		margin: 0.2rem 0 0;
		font-size: 0.95rem;
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}

	:global(.back-btn),
	:global(.export-btn) {
		min-height: 2.75rem;
	}

	.stat-cards {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.85rem;
		max-width: 28rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1rem 1.1rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: var(--mdc-theme-surface, transparent);
	}

	.stat-card__label {
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.stat-card__value {
		font-size: 1.85rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.table-panel {
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: var(--mdc-theme-surface, transparent);
		overflow: auto;
		max-height: calc(100dvh - 14rem);
	}

	.table-panel__title {
		margin: 0 0 0.65rem;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		padding: 3rem 1rem;
		text-align: center;
		border: 1px dashed color-mix(in srgb, currentColor 28%, transparent);
		border-radius: 8px;
		opacity: 0.85;

		p {
			margin: 0;
			font-size: 1.1rem;
		}
	}

	@media (prefers-color-scheme: dark) {
		.stat-card,
		.table-panel {
			background: var(--mdc-theme-surface, #212121);
		}
	}
</style>
