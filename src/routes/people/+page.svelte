<script lang="ts">
	import type { person } from '$lib/types/rows';
	import DataTable, { Head, Body, Row, Cell, Label, SortValue } from '@smui/data-table';
	import LayoutGrid, {Cell as GridCell} from '@smui/layout-grid';
	import Button, { Icon } from '@smui/button';
	import Textfield from '@smui/textfield';
	import { DateTime } from 'luxon';
	import type { PageData } from './$types';
	export let data: PageData;
	let query = '';
	const handleInput = (e: any) => {
		console.log('handleInput', e);
		query = e.target.value;
		const queryVal = e.target.value.toLowerCase();
		people = data.people.filter((p: person) => {
			return `${p.FirstName} ${p.LastName}`.toLowerCase().includes(queryVal);
		});
	};
	let people = data.people;
</script>

<LayoutGrid>
	<GridCell span={7}>
		<Textfield value={query} on:input={(event) => handleInput(event)} label="Search" />
	</GridCell>
	<GridCell span={5}>
		<Button href="/people/new" variant="unelevated" class="button-shaped-round">
			<Icon class="material-icons">add</Icon>
			<Label>Add New Person</Label>
		</Button>
	</GridCell>

	<GridCell span={12}>
		<DataTable table$aria-label="User list" style="width: 100%;height:90%">
			<Head>
				<Row>
					<Cell columnId="firstname">
						<Label>First Name</Label>
					</Cell>
					<Cell columnId="lastname">
						<Label>Last Name</Label>
					</Cell>
					<Cell columnId="lastname">
						<Label>Born</Label>
					</Cell>
					<!-- 
					<Cell columnId="username">
						<Label>Username</Label>
						<IconButton class="material-icons">arrow_upward</IconButton>
					</Cell>
					<Cell columnId="email">
						<Label>Email</Label>
						<IconButton class="material-icons">arrow_upward</IconButton>
					</Cell> -->
					<!-- You can turn off sorting for a column. -->
					<!-- <Cell sortable={false}>Website</Cell> -->
				</Row>
			</Head>
			<Body>
				{#each people as item}
					<Row>
						<Cell>{item.FirstName}</Cell>
						<Cell>{item.LastName}</Cell>
						<Cell
							>{item.DateOfBirth ? DateTime.fromISO(item.DateOfBirth).toFormat('yyyy') : ''}</Cell
						>
						<Cell><a href={`/people/${item.Id}`}>Edit</a></Cell>
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
