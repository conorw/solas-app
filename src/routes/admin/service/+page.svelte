<!-- @migration-task Error while migrating Svelte code: Identifier 'service' has already been declared -->
<script lang="ts">
	import type { service } from '$lib/types/rows';
	import DataTable, { Head, Body, Row, Cell, Label } from '@smui/data-table';
	import FormField from '@smui/form-field';
	import LayoutGrid, { Cell as GridCell } from '@smui/layout-grid';
	import Button, { Icon } from '@smui/button';
	import Textfield from '@smui/textfield';
	import type { PageData } from './$types';
	import Checkbox from '@smui/checkbox';
	export let data: PageData;
	let query = '';
	const handleInput = (e: any) => {
		const queryVal = query.toLowerCase();
		service = data.service
			.filter((p: service) => {
				return `${p.Name}`.toLowerCase().includes(queryVal);
			})
			.sort((a, b) => {
				return a.Name?.localeCompare(b.Name || '');
			});
	};
	let service = data.service;
	import Dialog, { Title, Content, Actions } from '@smui/dialog';

	let open = false;
	let clicked = 'Nothing yet.';
	let newItem = {
		Name: '',
		'Is Current': true,
		Multi: false
	};
</script>

<LayoutGrid>
	<GridCell span={7}>
		<Textfield bind:value={query} oninput={(event) => handleInput(event)} label="Search" />
	</GridCell>
	<GridCell span={5}>
		<Button
			style="float:right;"
			onclick={() => (open = true)}
			variant="unelevated"
			class="button-shaped-round"
		>
			<Icon class="material-icons">add</Icon>
			<Label>Add New Service</Label>
		</Button>
	</GridCell>
	<GridCell span={12}>
		<DataTable stickyHeader table$aria-label="Service list" style="width: 100%;height:70vh;overflow:auto">
			<Head>
				<Row>
					<Cell columnId="Id">
						<Label>Name</Label>
					</Cell>
					<Cell columnId="firstname">
						<Label>Is Current</Label>
					</Cell>
					<Cell columnId="multi">
						<Label>Is Bulk Add Event?</Label>
					</Cell>
				</Row>
			</Head>
			<Body>
				{#each service as item}
					<Row>
						<Cell>{item?.Name}</Cell>
						<Cell>
							<Checkbox
								onchange={async () => {
									const ret = await data.supabase
										.from('service')
										.update({ 'Is Current': item['Is Current'] })
										.eq('Auto ID', item['Auto ID']);
									if (ret.error) {
										console.log(ret.error);
									}
								}}
								bind:checked={item['Is Current']}
							/>
						</Cell>
						<Cell>
							<Checkbox
								onchange={async () => {
									const ret = await data.supabase
										.from('service')
										.update({ Multi: item['Multi'] })
										.eq('Auto ID', item['Auto ID']);
									if (ret.error) {
										console.log(ret.error);
									}
								}}
								bind:checked={item['Multi']}
							/>
						</Cell>
						<!-- 
        <Cell>{item.username}</Cell>
        <Cell>{item.email}</Cell>
        <Cell>{item.website}</Cell> -->
					</Row>
				{/each}
			</Body>
		</DataTable>
	</GridCell>
</LayoutGrid>
<Dialog bind:open aria-labelledby="simple-title" aria-describedby="simple-content">
	<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
	<Title id="simple-title">Add New Service</Title>
	<Content id="simple-content">
		<Textfield bind:value={newItem.Name} label="Name" />
		<FormField>
			<Checkbox bind:checked={newItem['Is Current']} />
			{#snippet label()}is Current?{/snippet}
		</FormField>
		<FormField>
			<Checkbox bind:checked={newItem['Multi']} />
			{#snippet label()}Is Bulk Event?{/snippet}
		</FormField>
	</Content>
	<Actions>
		<Button onclick={() => (clicked = 'No')}>
			<Label>Cancel</Label>
		</Button>
		<Button
			onclick={() => {
				data.supabase
					.from('service')
					.upsert([newItem])
					.select('*')
					.then((ret) => {
						if (ret.error) {
							console.log(ret.error);
						} else {
							service.push(ret.data[0]);
							service = [...service];
							newItem = {
								Name: '',
								'Is Current': true,
								Multi: false
							};
							handleInput(null);
						}
					});
			}}
		>
			<Label>Save</Label>
		</Button>
	</Actions>
</Dialog>
