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
		'Is Current': true
	};
</script>

<LayoutGrid>
	<GridCell span={7}>
		<Textfield bind:value={query} on:input={(event) => handleInput(event)} label="Search" />
	</GridCell>
	<GridCell span={5}>
		<Button
			style="float:right;"
			on:click={() => (open = true)}
			variant="unelevated"
			class="button-shaped-round"
		>
			<Icon class="material-icons">add</Icon>
			<Label>Add New Service</Label>
		</Button>
	</GridCell>
	<GridCell span={12}>
		<DataTable table$aria-label="User list">
			<Head>
				<Row>
					<Cell columnId="Id">
						<Label>Name</Label>
					</Cell>
					<Cell columnId="firstname">
						<Label>Is Current</Label>
					</Cell>
				</Row>
			</Head>
			<Body>
				{#each service as item}
					<Row>
						<Cell>{item?.Name}</Cell>
						<Cell>
							<Checkbox
								on:change={async () => {
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
			<span slot="label">is Current?</span>
		</FormField>
	</Content>
	<Actions>
		<Button on:click={() => (clicked = 'No')}>
			<Label>Cancel</Label>
		</Button>
		<Button
			on:click={() => {
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
								'Is Current': true
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
