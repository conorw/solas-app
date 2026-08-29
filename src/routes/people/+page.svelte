<script lang="ts">
	import type { person } from '#lib/types/rows.js';
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import Button, { Label, Icon } from '@smui/button';
	import Snackbar from '@smui/snackbar';
	import type { PageData } from './$types';
	import IconButton from '@smui/icon-button';
	import { Icon as CommonIcon } from '@smui/common';
	import { untrack } from 'svelte';
	import { getPersonDisplayName } from '#lib/person.js';
	import { virtualWindow } from '#lib/virtualWindow.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let query = $state('');
	let snackbar: Snackbar;
	let snackMessage = $state('');
	/** Local override after deletes; null means use server `data.people`. */
	let peopleOverride = $state<person[] | null>(null);
	let panelEl = $state<HTMLDivElement | undefined>(undefined);
	let scrollTop = $state(0);
	let viewportHeight = $state(600);
	let rowHeight = $state(56);

	const OVERSCAN = 10;

	$effect(() => {
		data.people;
		peopleOverride = null;
	});

	const peopleList = $derived(peopleOverride ?? data.people ?? []);

	function birthYear(dob: string | null | undefined): string {
		return dob && dob.length >= 4 ? dob.slice(0, 4) : '';
	}

	const people = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const list = peopleList;
		if (!q) return list;
		return list.filter((p: person) => {
			const name = `${p.FirstName ?? ''} ${p.LastName ?? ''}`.toLowerCase();
			return name.includes(q) || birthYear(p.DateOfBirth).includes(q);
		});
	});

	const windowed = $derived.by(() => {
		const w = virtualWindow(people.length, scrollTop, viewportHeight, rowHeight, OVERSCAN);
		return { ...w, items: people.slice(w.start, w.end) };
	});

	$effect(() => {
		query;
		untrack(() => {
			scrollTop = 0;
			if (panelEl) panelEl.scrollTop = 0;
		});
	});

	$effect(() => {
		const el = panelEl;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			viewportHeight = el.clientHeight;
		});
		ro.observe(el);
		viewportHeight = el.clientHeight;
		return () => ro.disconnect();
	});

	$effect(() => {
		const el = panelEl;
		windowed.items;
		if (!el) return;
		const row = el.querySelector('tbody .mdc-data-table__row');
		if (!(row instanceof HTMLElement)) return;
		const height = row.getBoundingClientRect().height;
		if (height > 0 && Math.abs(height - rowHeight) > 0.5) {
			rowHeight = height;
		}
	});

	function clearSearch() {
		query = '';
	}

	function onPanelScroll(event: Event) {
		scrollTop = (event.currentTarget as HTMLDivElement).scrollTop;
	}

	async function deletePerson(personRow: person) {
		const display = getPersonDisplayName(personRow) || 'this person';
		if (
			!confirm(
				`Delete ${display} from the system? This also removes all of their attendance records.`
			)
		) {
			return;
		}

		const deleteAttendance = await data.supabase
			.from('attendance')
			.delete()
			.eq('Person Id', personRow['Auto ID']);

		if (deleteAttendance.error) {
			snackMessage = `Error deleting attendance records for this person: ${deleteAttendance.error.message}`;
			snackbar.open();
			return;
		}

		const ret = await data.supabase
			.from('people')
			.delete()
			.eq('Auto ID', personRow['Auto ID'])
			.select('"Auto ID"');

		if (ret.error) {
			snackMessage = `Error deleting this person: ${ret.error.message}`;
			snackbar.open();
			return;
		}
		if (!ret.data?.length) {
			snackMessage = `Error deleting this person: no matching row was deleted`;
			snackbar.open();
			return;
		}

		snackMessage = `Person ${personRow.FirstName} ${personRow.LastName} deleted successfully`;
		snackbar.open();
		peopleOverride = peopleList.filter((p) => p['Auto ID'] != personRow['Auto ID']);
	}
</script>

<div class="people-page">
	<header class="people-toolbar">
		<div class="people-toolbar__search">
			<input
				type="search"
				class="search-input"
				aria-label="Search"
				placeholder="Search"
				bind:value={query}
			/>
			{#if query}
				<IconButton type="button" aria-label="Clear" onclick={clearSearch}>
					<CommonIcon class="material-icons">clear</CommonIcon>
				</IconButton>
			{/if}
		</div>
		<div class="people-toolbar__actions">
			<span class="result-count" aria-live="polite">
				{people.length} {people.length === 1 ? 'person' : 'people'}
			</span>
			<Button href="/people/new" variant="unelevated" class="add-btn">
				<Icon class="material-icons">person_add</Icon>
				<Label>Add person</Label>
			</Button>
		</div>
	</header>

	{#if people.length}
		<div class="table-panel" bind:this={panelEl} onscroll={onPanelScroll}>
			<DataTable
				stickyHeader
				table$aria-label="User list"
				table$aria-rowcount={people.length}
				class="people-table"
			>
				<Head>
					<Row>
						<Cell columnId="firstname"><TableLabel>First Name</TableLabel></Cell>
						<Cell columnId="lastname"><TableLabel>Last Name</TableLabel></Cell>
						<Cell columnId="born"><TableLabel>Born</TableLabel></Cell>
						<Cell columnId="actions" style="width: 1%;"><TableLabel>Actions</TableLabel></Cell>
					</Row>
				</Head>
				<Body>
					{#if windowed.topPad > 0}
						<tr class="virtual-spacer" aria-hidden="true">
							<td colspan="4" style="height: {windowed.topPad}px"></td>
						</tr>
					{/if}
					{#each windowed.items as item (item['Auto ID'])}
						<Row>
							<Cell>
								<a class="name-link" href={`/people/${item['Auto ID']}`}>{item.FirstName}</a>
							</Cell>
							<Cell>
								<a class="name-link" href={`/people/${item['Auto ID']}`}>{item.LastName}</a>
							</Cell>
							<Cell>
								{birthYear(item.DateOfBirth) || '—'}
							</Cell>
							<Cell>
								<div class="row-actions">
									<Button href={`/people/${item['Auto ID']}`} variant="outlined" class="action-btn">
										<Label>Edit</Label>
									</Button>
									{#if data.profile?.isAdmin}
										<Button
											href={`/admin/stats/people/${item['Auto ID']}`}
											variant="outlined"
											class="action-btn"
										>
											<Label>History</Label>
										</Button>
									{/if}
									<IconButton
										type="button"
										class="delete-btn"
										aria-label="Delete person"
										data-testid="delete-person"
										onclick={() => deletePerson(item)}
									>
										<CommonIcon class="material-icons" aria-hidden="true">delete</CommonIcon>
									</IconButton>
								</div>
							</Cell>
						</Row>
					{/each}
					{#if windowed.bottomPad > 0}
						<tr class="virtual-spacer" aria-hidden="true">
							<td colspan="4" style="height: {windowed.bottomPad}px"></td>
						</tr>
					{/if}
				</Body>
			</DataTable>
		</div>
	{:else}
		<div class="empty-state">
			{#if query.trim()}
				<p>No people match “{query.trim()}”.</p>
				<Button variant="outlined" onclick={clearSearch}>
					<Label>Clear search</Label>
				</Button>
			{:else}
				<p>No people yet.</p>
				<Button href="/people/new" variant="unelevated">
					<Icon class="material-icons">person_add</Icon>
					<Label>Add person</Label>
				</Button>
			{/if}
		</div>
	{/if}
</div>

<Snackbar bind:this={snackbar}>
	<Label>{snackMessage}</Label>
</Snackbar>

<style lang="scss">
	.people-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 1.25rem 2rem;
		max-width: 72rem;
		margin: 0 auto;
		min-height: calc(100dvh - 5rem);
	}

	.people-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.85rem 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		background: var(--mdc-theme-surface, transparent);
	}

	.people-toolbar__search {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
		flex: 1 1 16rem;
		min-width: 0;
	}

	.search-input {
		flex: 1;
		min-width: 0;
		min-height: 3.25rem;
		padding: 0.75rem 1rem;
		border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
		border-radius: 4px;
		font: inherit;
		background: transparent;
		color: inherit;
	}

	.people-toolbar__actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.result-count {
		font-size: 0.95rem;
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}

	:global(.add-btn) {
		min-height: 2.75rem;
	}

	.table-panel {
		flex: 1;
		min-height: 0;
		overflow: auto;
		max-height: calc(100dvh - 11rem);
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		background: var(--mdc-theme-surface, transparent);
	}

	:global(.people-table) {
		width: 100%;
		overflow: visible;
	}

	:global(.people-table .mdc-data-table__table-container) {
		overflow: visible;
	}

	:global(.people-table .virtual-spacer td) {
		padding: 0;
		border: none;
		line-height: 0;
		font-size: 0;
	}

	:global(.people-table .mdc-data-table__row) {
		min-height: 3.25rem;
	}

	:global(.people-table .mdc-data-table__cell),
	:global(.people-table .mdc-data-table__header-cell) {
		padding-top: 0.65rem;
		padding-bottom: 0.65rem;
	}

	.name-link {
		color: inherit;
		text-decoration: none;
		font-weight: 500;
	}

	.name-link:hover,
	.name-link:focus-visible {
		color: var(--mdc-theme-primary, #40b3ff);
		text-decoration: underline;
	}

	.row-actions {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.35rem;
	}

	:global(.action-btn) {
		min-height: 2.5rem;
		white-space: nowrap;
	}

	:global(.delete-btn) {
		width: 2.75rem;
		height: 2.75rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		padding: 3rem 1.25rem;
		text-align: center;
		border: 1px dashed color-mix(in srgb, currentColor 28%, transparent);
		border-radius: 8px;
		color: color-mix(in srgb, currentColor 75%, transparent);

		p {
			margin: 0;
			font-size: 1.1rem;
		}
	}

	@media (prefers-color-scheme: dark) {
		.people-toolbar,
		.table-panel {
			background: var(--mdc-theme-surface, #212121);
		}

		.name-link:hover,
		.name-link:focus-visible {
			color: #7ecbff;
		}
	}
</style>
