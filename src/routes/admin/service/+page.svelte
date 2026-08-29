<script lang="ts">
	import type { service as ServiceRow } from '#lib/types/rows.js';
	import DataTable, { Head, Body, Row, Cell, Label as TableLabel } from '@smui/data-table';
	import FormField from '@smui/form-field';
	import Button, { Icon, Label } from '@smui/button';
	import Textfield from '@smui/textfield';
	import type { PageData } from './$types';
	import Checkbox from '@smui/checkbox';
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import Snackbar from '@smui/snackbar';
	import IconButton from '@smui/icon-button';
	import { Icon as CommonIcon } from '@smui/common';

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

	function openAddDialog() {
		newItem = { Name: '', 'Is Current': true, Multi: false };
		formError = '';
		open = true;
	}

	async function updateFlag(item: ServiceRow, field: 'Is Current' | 'Multi', checked: boolean) {
		item[field] = checked;
		const ret = await data.supabase
			.from('service')
			.update({ [field]: checked })
			.eq('Auto ID', item['Auto ID']);
		if (ret.error) {
			item[field] = !checked;
			showSnack(`Could not update ${item.Name}: ${ret.error.message}`);
		}
	}

	async function onCurrentChange(item: ServiceRow, e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		item['Is Current'] = checked;
		await updateFlag(item, 'Is Current', checked);
	}

	async function onMultiChange(item: ServiceRow, e: Event) {
		const checked = (e.currentTarget as HTMLInputElement).checked;
		item.Multi = checked;
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
		const ret = await data.supabase.from('service').upsert([payload]).select('*');
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

<div class="service-page">
	<header class="service-toolbar">
		<div class="service-toolbar__search">
			<Textfield class="search-field" bind:value={query} label="Search" input$aria-label="Search" input$oninput={onSearchInput} />
			{#if query}
				<IconButton type="button" aria-label="Clear search" onclick={clearSearch}>
					<CommonIcon class="material-icons">clear</CommonIcon>
				</IconButton>
			{/if}
		</div>
		<div class="service-toolbar__actions">
			<span class="result-count" aria-live="polite">
				{services.length} {services.length === 1 ? 'service' : 'services'}
			</span>
			<Button onclick={openAddDialog} variant="unelevated" class="add-btn">
				<Icon class="material-icons">add</Icon>
				<Label>Add New Service</Label>
			</Button>
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
								<FormField>
									<Checkbox
										checked={item['Is Current']}
										onchange={(e) => onCurrentChange(item, e)}
										input$aria-label={`Active: ${item.Name}`}
									/>
									{#snippet label()}Active{/snippet}
								</FormField>
							</Cell>
							<Cell>
								<FormField>
									<Checkbox
										checked={item.Multi}
										onchange={(e) => onMultiChange(item, e)}
										input$aria-label={`Multi event: ${item.Name}`}
									/>
									{#snippet label()}Multi{/snippet}
								</FormField>
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
				<Button variant="unelevated" onclick={openAddDialog}>
					<Icon class="material-icons">add</Icon>
					<Label>Add New Service</Label>
				</Button>
			{/if}
		</div>
	{/if}
</div>

<Dialog bind:open aria-labelledby="simple-title" aria-describedby="simple-content">
	<Title id="simple-title">Add New Service</Title>
	<Content id="simple-content">
		<div class="dialog-body">
			<Textfield
				class="dialog-name"
				bind:value={newItem.Name}
				label="Name"
				input$aria-label="Service name"
			/>
			{#if formError}
				<p class="form-error" role="alert">{formError}</p>
			{/if}
			<FormField>
				<Checkbox bind:checked={newItem['Is Current']} />
				{#snippet label()}Active (available for attendance){/snippet}
			</FormField>
			<FormField>
				<Checkbox bind:checked={newItem.Multi} />
				{#snippet label()}Multi event (anonymous group count){/snippet}
			</FormField>
		</div>
	</Content>
	<Actions>
		<Button onclick={() => (open = false)} disabled={saving}>
			<Label>Cancel</Label>
		</Button>
		<Button variant="raised" onclick={saveNewService} disabled={saving}>
			<Label>Save</Label>
		</Button>
	</Actions>
</Dialog>

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

	:global(.search-field) {
		flex: 1;
		min-width: 0;
	}

	:global(.search-field .mdc-text-field) {
		width: 100%;
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

	:global(.dialog-name),
	:global(.dialog-name .mdc-text-field) {
		width: 100%;
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
