<script lang="ts">
	import type { person } from '#lib/types/rows.js';
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import Button, { Label, Icon } from '@smui/button';
	import Snackbar from '@smui/snackbar';
	import Textfield from '@smui/textfield';
	import { DateTime } from 'luxon';
	import type { PageData } from './$types';
	import IconButton from '@smui/icon-button';
	import { Icon as CommonIcon } from '@smui/common';
	import { getPersonDisplayName } from '#lib/person.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let query = $state('');
	let snackbar: Snackbar;
	let snackMessage = $state('');
	/** Local override after deletes; null means use server `data.people`. */
	let peopleOverride = $state<person[] | null>(null);

	$effect(() => {
		data.people;
		peopleOverride = null;
	});

	const peopleList = $derived(peopleOverride ?? data.people ?? []);

	const people = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const list = peopleList;
		if (!q) return list;
		return list.filter((p: person) => {
			const name = `${p.FirstName ?? ''} ${p.LastName ?? ''}`.toLowerCase();
			const born = p.DateOfBirth
				? DateTime.fromISO(p.DateOfBirth).toFormat('yyyy')
				: '';
			return name.includes(q) || born.includes(q);
		});
	});

	function clearSearch() {
		query = '';
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
			<Textfield
				class="search-field"
				bind:value={query}
				label="Search"
				input$aria-label="Search"
			/>
			{#if query}
				<IconButton type="button" aria-label="Clear search" onclick={clearSearch}>
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
		<div class="table-panel">
			<DataTable
				stickyHeader
				table$aria-label="User list"
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
					{#each people as item (item['Auto ID'])}
						<Row>
							<Cell>
								<a class="name-link" href={`/people/${item['Auto ID']}`}>{item.FirstName}</a>
							</Cell>
							<Cell>
								<a class="name-link" href={`/people/${item['Auto ID']}`}>{item.LastName}</a>
							</Cell>
							<Cell>
								{item.DateOfBirth
									? DateTime.fromISO(item.DateOfBirth).toFormat('yyyy')
									: '—'}
							</Cell>
							<Cell>
								<div class="row-actions">
									<Button
										href={`/people/${item['Auto ID']}`}
										variant="outlined"
										class="action-btn"
									>
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

	:global(.search-field) {
		flex: 1;
		min-width: 0;
	}

	:global(.search-field .mdc-text-field) {
		width: 100%;
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

	@media (max-width: 640px) {
		.row-actions {
			flex-wrap: wrap;
			justify-content: flex-start;
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
