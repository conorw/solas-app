<script lang="ts">
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import Tab, { Label } from '@smui/tab';
	import TabBar from '@smui/tab-bar';
	import Button, { Icon, Label as ButtonLabel } from '@smui/button';
	import type { PageServerData } from './$types';
	import PersonForm from '../../../../../components/PersonForm.svelte';
	import { page } from '$app/state';
	import { getPersonDisplayName } from '#lib/person.js';

	interface Props {
		data: PageServerData;
	}

	let { data }: Props = $props();

	let active = $state('Stats');
	const displayName = $derived(
		data.person?.['Full Name'] || getPersonDisplayName(data.person) || 'Person'
	);
	const firstSession = $derived(data.stats?.length ? data.stats[data.stats.length - 1]?.Date : '—');
	const latestSession = $derived(data.stats?.length ? data.stats[0]?.Date : '—');
</script>

<div class="person-stats">
	<header class="person-stats__header">
		<Button href="/admin/stats" variant="outlined" class="back-btn">
			<Icon class="material-icons">arrow_back</Icon>
			<ButtonLabel>Stats</ButtonLabel>
		</Button>
		<h1>{displayName}</h1>
	</header>

	{#if data.person}
		<TabBar tabs={['Stats', 'Details']} bind:active class="tabs">
			{#snippet tab(tab)}
				<Tab {tab}>
					<Label>{tab}</Label>
				</Tab>
			{/snippet}
		</TabBar>

		{#if active === 'Stats'}
			{#if data.stats?.length}
				<section class="stat-cards" aria-label="Summary">
					<div class="stat-card">
						<span class="stat-card__label">Total sessions</span>
						<span class="stat-card__value">{data.stats.length}</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Most popular service</span>
						<span class="stat-card__value stat-card__value--text">{data.popularService}</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">First session</span>
						<span class="stat-card__value stat-card__value--text">{firstSession}</span>
					</div>
					<div class="stat-card">
						<span class="stat-card__label">Latest session</span>
						<span class="stat-card__value stat-card__value--text">{latestSession}</span>
					</div>
				</section>

				<section class="tables-grid">
					<div class="table-panel">
						<h2 class="table-panel__title">Attendance history</h2>
						<DataTable table$aria-label="Attendance list" style="width: 100%;">
							<Head>
								<Row>
									<Cell columnId="date"><TableLabel>Date</TableLabel></Cell>
									<Cell columnId="service"><TableLabel>Service</TableLabel></Cell>
								</Row>
							</Head>
							<Body>
								{#each data.stats as item}
									<Row>
										<Cell>{item?.Date}</Cell>
										<Cell>{item?.ServiceName}</Cell>
									</Row>
								{/each}
							</Body>
						</DataTable>
					</div>

					<div class="table-panel">
						<h2 class="table-panel__title">By service</h2>
						<DataTable table$aria-label="Service list" style="width: 100%;">
							<Head>
								<Row>
									<Cell columnId="name"><TableLabel>Service</TableLabel></Cell>
									<Cell columnId="total" numeric><TableLabel>Sessions</TableLabel></Cell>
								</Row>
							</Head>
							<Body>
								{#each data.groupedService as item}
									<Row>
										<Cell>{item?.[0]}</Cell>
										<Cell numeric>{item?.[1].length}</Cell>
									</Row>
								{/each}
							</Body>
						</DataTable>
					</div>
				</section>
			{:else}
				<div class="empty-state">
					<p>No attendance recorded for this person.</p>
				</div>
			{/if}
		{:else}
			<PersonForm
				supabase={page.data.supabase}
				onSave={() => history.back()}
				person={data?.person}
				title="Edit person"
			/>
		{/if}
	{:else}
		<div class="empty-state">
			<p>Person not found.</p>
			<Button href="/admin/stats" variant="outlined">
				<ButtonLabel>Back to stats</ButtonLabel>
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	.person-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 1.25rem 2rem;
		max-width: 72rem;
		margin: 0 auto;
	}

	.person-stats__header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;

		h1 {
			margin: 0;
			font-size: 1.45rem;
			font-weight: 600;
		}
	}

	:global(.back-btn) {
		min-height: 2.5rem;
	}

	:global(.tabs) {
		margin-bottom: 0.25rem;
	}

	.stat-cards {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.85rem;
	}

	@media (max-width: 900px) {
		.stat-cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 520px) {
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
		min-height: 5rem;
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
		line-height: 1.15;
		font-variant-numeric: tabular-nums;
	}

	.stat-card__value--text {
		font-size: 1.05rem;
		overflow-wrap: anywhere;
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
		max-height: min(70vh, 36rem);
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
