<script lang="ts">
	import type { person } from '$lib/types/rows';
	import DataTable, { Head, Body, Row, Cell, Label } from '@smui/data-table';
	import LayoutGrid, { Cell as GridCell } from '@smui/layout-grid';
	import Button, { Icon } from '@smui/button';
	import Snackbar from '@smui/snackbar';
	import Textfield from '@smui/textfield';
	import { DateTime } from 'luxon';
	import type { PageData } from './$types';
	import IconButton from '@smui/icon-button';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let query = $state('');
	const handleInput = (e: any) => {
		query = e.target.value;
		const queryVal = e.target.value.toLowerCase();
		people = data.people.filter((p: person) => {
			return `${p.FirstName} ${p.LastName}`.toLowerCase().includes(queryVal);
		});
	};
	let snackbarWithoutClose: Snackbar;
	let snackMessage = $state('');
	let people = $state(data.people);

	async function deletePerson(person: person) {
		// show a confirmation dialog
		if (
			confirm(
				`Are you sure you want to entirely delete ${person.FirstName} ${person.LastName} (userid: ${person['Auto ID']}) from the system? Warning: This will also delete all attendance records for this person!`
			)
		) {
			// delete the attendance records and then the person
			const deleteAttendance = await data.supabase
				.from('attendance')
				.delete()
				.match({ 'Person Id': person['Auto ID'] });

			if (deleteAttendance.status !== 204) {
				snackMessage = `Error deleting attendance records for this person: ${deleteAttendance.error?.message}`;
				snackbarWithoutClose.open();
				return;
			}
			// delete the person
			const ret = await data.supabase
				.from('people')
				.delete()
				.match({ 'Auto ID': person['Auto ID'] });
			if (ret.status !== 204) {
				snackMessage = `Error deleting this person: ${ret.error?.message}`;
				snackbarWithoutClose.open();
				return;
			} else {
				snackMessage = `Person ${person.FirstName} ${person.LastName} deleted successfully`;
				snackbarWithoutClose.open();
				// remove the person from the list
				people = people.filter((p) => p['Auto ID'] !== person['Auto ID']);
			}
		}
	}
</script>

<LayoutGrid>
	<GridCell span={7}>
		<Textfield value={query} oninput={(event) => handleInput(event)} label="Search" />
	</GridCell>
	<GridCell span={5}>
		<Button href="/people/new" variant="unelevated" class="button-shaped-round">
			<Icon class="material-icons">add</Icon>
			<Label>Add New Person</Label>
		</Button>
	</GridCell>

	<GridCell span={12}>
		<DataTable
			stickyHeader
			table$aria-label="User list"
			style="width: 100%;height:70vh;overflow:auto"
		>
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

						<Cell><a href={`/people/${item['Auto ID']}`}>Edit</a></Cell>
						<Cell
							><IconButton class="material-icons" onclick={() => deletePerson(item)}
								>delete</IconButton
							></Cell
						>
						{#if data.profile?.isAdmin}
							<Cell>
								<a href={`/admin/stats/people/${item['Auto ID']}`}>History</a>
							</Cell>
						{/if}
						<!-- 
				<Cell>{item.username}</Cell>
				<Cell>{item.email}</Cell>
				<Cell>{item.website}</Cell> -->
					</Row>
				{/each}
			</Body>
		</DataTable>
	</GridCell>
	<Snackbar bind:this={snackbarWithoutClose}>
		<Label>{snackMessage}</Label>
	  </Snackbar>
</LayoutGrid>
