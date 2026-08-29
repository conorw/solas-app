<script lang="ts">
	import type { service as ServiceRow } from '#lib/types/rows.js';
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import Button, { Label } from '@smui/button';
	import type { PageData } from './$types';
	import Snackbar from '@smui/snackbar';
	import IconButton from '@smui/icon-button';
	import { Icon as CommonIcon } from '@smui/common';
	import { onMount } from 'svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let query = $state('');
	let open = $state(false);
	let saving = $state(false);
	let snackbar: Snackbar;
	let snackMessage = $state('');
	let servicesOverride = $state<ServiceRow[] | null>(null);
	let newItem = $state({
		Name: '',
		'Is Current': true,
		Multi: false
	});
	let formError = $state('');
	let hydrated = $state(false);

	onMount(() => {
		hydrated = true;
	});

	$effect(() => {
		data.service;
		servicesOverride = null;
	});

	const allServices = $derived(servicesOverride ?? data.service ?? []);

	const services = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const list = [...allServices].sort(
			(a, b) => a.Name?.localeCompare(b.Name || '', undefined, { sensitivity: 'base' }) ?? 0
		);
		if (!q) return list;
		return list.filter((p) => `${p.Name ?? ''}`.toLowerCase().includes(q));
	});

	function showSnack(message: string) {
		snackMessage = message;
		snackbar?.open();
	}

	function clearSearch() {
		query = '';
	}

	function onSearchInput(event: Event) {
		query = (event.currentTarget as HTMLInputElement).value;
	}

	function onNameInput(event: Event) {
		newItem.Name = (event.currentTarget as HTMLInputElement).value;
	}

	function openAddDialog() {
		newItem = { Name: '', 'Is Current': true, Multi: false };
		formError = '';
		open = true;
	}

	async function updateFlag(item: ServiceRow, field: 'Is Current' | 'Multi', checked: boolean) {
		const ret = await data.supabase
			.from('service')
			.update({ [field]: checked })
			.eq('Auto ID', item['Auto ID']);
		if (ret.error) {
			item[field] = !checked;
			showSnack(`Could not update ${item.Name}: ${ret.error.message}`);
			return;
		}
		servicesOverride = (servicesOverride ?? allServices).map((row) =>
			row['Auto ID'] === item['Auto ID'] ? { ...row, [field]: checked } : row
		);
	}

	async function onCurrentChange(item: ServiceRow, e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		await updateFlag(item, 'Is Current', checked);
	}

	async function onMultiChange(item: ServiceRow, e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		await updateFlag(item, 'Multi', checked);
	}

	async function saveNewService() {
		formError = '';
		const name = newItem.Name.trim();
		if (!name) {
			formError = 'Enter a service name.';
			return;
		}
		saving = true;
		const payload = {
			Name: name,
			'Is Current': newItem['Is Current'],
			Multi: newItem.Multi
		};
		const ret = await data.supabase.from('service').insert([payload]).select('*');
		saving = false;
		if (ret.error) {
			formError = ret.error.message;
			showSnack(`Could not save service: ${ret.error.message}`);
			return;
		}
		const created = ret.data?.[0] as ServiceRow;
		servicesOverride = [...allServices, created];
		newItem = { Name: '', 'Is Current': true, Multi: false };
		open = false;
		showSnack(`Added ${created.Name}`);
	}
</script>

<div class="service-page" data-testid="service-page" data-ready={hydrated ? 'true' : undefined}>
	<header class="service-toolbar">
		<div class="service-toolbar__search">
			<input
				type="search"
				class="search-input"
				aria-label="Search"
				placeholder="Search"
				bind:value={query}
				oninput={onSearchInput}
			/>
			{#if query}
				<IconButton type="button" aria-label="Clear" onclick={clearSearch}>
					<CommonIcon class="material-icons">clear</CommonIcon>
				</IconButton>
			{/if}
		</div>
		<div class="service-toolbar__actions">
			<span class="result-count" aria-live="polite">
				{services.length} {services.length === 1 ? 'service' : 'services'}
			</span>
			<button
				type="button"
				class="add-btn native-add-btn"
				data-testid="add-service"
				onclick={openAddDialog}
			>
				<span class="material-icons" aria-hidden="true">add</span>
				Add New Service
			</button>
		</div>
	</header>

	<p class="hint">
		Active services appear when adding attendance. Multi events are used for anonymous group counts.
	</p>

	{#if services.length}
		<div class="table-panel">
			<DataTable stickyHeader table$aria-label="Service list" class="service-table">
				<Head>
					<Row>
						<Cell columnId="name"><TableLabel>Name</TableLabel></Cell>
						<Cell columnId="current"><TableLabel>Active</TableLabel></Cell>
						<Cell columnId="multi"><TableLabel>Multi event</TableLabel></Cell>
					</Row>
				</Head>
				<Body>
					{#each services as item (item['Auto ID'])}
						<Row class={!item['Is Current'] ? 'row-inactive' : ''}>
							<Cell>
								<span class="service-name">{item?.Name}</span>
							</Cell>
							<Cell>
								<label class="flag-control">
									<input
										type="checkbox"
										checked={item['Is Current']}
										aria-label={`Active: ${item.Name}`}
										data-testid={`service-active-${item['Auto ID']}`}
										onclick={(e) => e.stopPropagation()}
										onchange={(e) => onCurrentChange(item, e)}
									/>
									<span>Active</span>
								</label>
							</Cell>
							<Cell>
								<label class="flag-control">
									<input
										type="checkbox"
										checked={item.Multi}
										aria-label={`Multi event: ${item.Name}`}
										onclick={(e) => e.stopPropagation()}
										onchange={(e) => onMultiChange(item, e)}
									/>
									<span>Multi</span>
								</label>
							</Cell>
						</Row>
					{/each}
				</Body>
			</DataTable>
		</div>
	{:else}
		<div class="empty-state">
			{#if query.trim()}
				<p>No services match “{query.trim()}”.</p>
				<Button variant="outlined" onclick={clearSearch}>
					<Label>Clear search</Label>
				</Button>
			{:else}
				<p>No services yet.</p>
				<button
					type="button"
					class="native-add-btn"
					data-testid="add-service"
					onclick={openAddDialog}
				>
					<span class="material-icons" aria-hidden="true">add</span>
					Add New Service
				</button>
			{/if}
		</div>
	{/if}
</div>

{#if open}
	<div class="modal-backdrop">
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="simple-title"
			aria-label="Add New Service"
			data-testid="add-service-dialog"
		>
			<h2 id="simple-title">Add New Service</h2>
			<div class="dialog-body">
				<label class="dialog-name-field">
					<span class="dialog-name-field__label">Name</span>
					<input
						type="text"
						class="dialog-name-input"
						aria-label="Service name"
						bind:value={newItem.Name}
						oninput={onNameInput}
					/>
				</label>
				{#if formError}
					<p class="form-error" role="alert">{formError}</p>
				{/if}
				<label class="flag-control">
					<input type="checkbox" bind:checked={newItem['Is Current']} />
					<span>Active (available for attendance)</span>
				</label>
				<label class="flag-control">
					<input type="checkbox" bind:checked={newItem.Multi} />
					<span>Multi event (anonymous group count)</span>
				</label>
			</div>
			<div class="modal-actions">
				<button type="button" class="native-footer-btn" onclick={() => (open = false)} disabled={saving}>
					Cancel
				</button>
				<button
					type="button"
					class="native-footer-btn native-footer-btn--primary"
					data-testid="save-service"
					onclick={saveNewService}
					disabled={saving}
				>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}

<Snackbar bind:this={snackbar}>
	<Label>{snackMessage}</Label>
</Snackbar>

<style lang="scss">
	.service-page {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		padding: 1rem 1.25rem 2rem;
		max-width: 56rem;
		margin: 0 auto;
		min-height: calc(100dvh - 5rem);
	}

	.service-toolbar {
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

	.service-toolbar__search {
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

	.service-toolbar__actions {
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

	.native-add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 2.75rem;
		padding: 0 1rem;
		border: 0;
		border-radius: 4px;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
		background: var(--mdc-theme-primary, #40b3ff);
		color: var(--mdc-theme-on-primary, #fff);
	}

	.flag-control {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		white-space: nowrap;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: color-mix(in srgb, #000 45%, transparent);
	}

	.modal {
		width: min(26rem, 100%);
		padding: 1.15rem 1.25rem 1rem;
		border-radius: 8px;
		background: var(--mdc-theme-surface, #fff);
		color: inherit;
		box-shadow: 0 12px 40px color-mix(in srgb, #000 28%, transparent);

		h2 {
			margin: 0 0 0.85rem;
			font-size: 1.2rem;
		}
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.native-footer-btn {
		min-height: 2.75rem;
		min-width: 6.5rem;
		padding: 0 1rem;
		border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
		border-radius: 4px;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
		background: transparent;
		color: inherit;
	}

	.native-footer-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.native-footer-btn--primary {
		border-color: transparent;
		background: var(--mdc-theme-primary, #40b3ff);
		color: var(--mdc-theme-on-primary, #fff);
	}

	.hint {
		margin: 0;
		font-size: 0.95rem;
		opacity: 0.75;
		line-height: 1.4;
	}

	.table-panel {
		flex: 1;
		min-height: 0;
		overflow: auto;
		max-height: calc(100dvh - 13rem);
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		background: var(--mdc-theme-surface, transparent);
	}

	:global(.service-table) {
		width: 100%;
	}

	:global(.service-table .mdc-data-table__row) {
		min-height: 3.35rem;
	}

	:global(.service-table .mdc-data-table__cell),
	:global(.service-table .mdc-data-table__header-cell) {
		padding-top: 0.7rem;
		padding-bottom: 0.7rem;
		vertical-align: middle;
	}

	:global(.service-table .row-inactive .service-name) {
		opacity: 0.55;
	}

	.service-name {
		font-weight: 500;
	}

	.dialog-body {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		min-width: min(22rem, 70vw);
		padding-top: 0.35rem;
	}

	.dialog-name-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		width: 100%;
	}

	.dialog-name-field__label {
		font-size: 0.85rem;
		font-weight: 500;
		opacity: 0.85;
	}

	.dialog-name-input {
		width: 100%;
		min-height: 3.25rem;
		padding: 0.75rem 1rem;
		border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
		border-radius: 4px;
		font: inherit;
		background: transparent;
		color: inherit;
	}

	.form-error {
		margin: 0;
		color: var(--mdc-theme-error, #b00020);
		font-size: 0.9rem;
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
		.service-toolbar,
		.table-panel {
			background: var(--mdc-theme-surface, #212121);
		}
	}
</style>
