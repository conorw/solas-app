<script lang="ts">
	import type { person } from '#lib/types/rows.js';
	import DataTable, { Head, Body, Row, Cell, Label } from '@smui/data-table';
	import LayoutGrid, { Cell as GridCell } from '@smui/layout-grid';
	import Button, { Icon } from '@smui/button';
	import Snackbar from '@smui/snackbar';
	import Textfield from '@smui/textfield';
	import { DateTime } from 'luxon';
	import type { PageData } from './$types';
	import IconButton from '@smui/icon-button';
	import { Icon as CommonIcon } from '@smui/common';
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
		if (
			!confirm(
				`Are you sure you want to entirely delete ${person.FirstName} ${person.LastName} (userid: ${person['Auto ID']}) from the system? Warning: This will also delete all attendance records for this person!`
			)
		) {
			return;
		}

		const deleteAttendance = await data.supabase
			.from('attendance')
			.delete()
			.eq('Person Id', person['Auto ID']);

		if (deleteAttendance.error) {
			snackMessage = `Error deleting attendance records for this person: ${deleteAttendance.error.message}`;
			snackbarWithoutClose.open();
			return;
		}

		const ret = await data.supabase
			.from('people')
			.delete()
			.eq('Auto ID', person['Auto ID'])
			.select('"Auto ID"');

		if (ret.error) {
			snackMessage = `Error deleting this person: ${ret.error.message}`;
			snackbarWithoutClose.open();
			return;
		}
		if (!ret.data?.length) {
			snackMessage = `Error deleting this person: no matching row was deleted`;
			snackbarWithoutClose.open();
			return;
		}

		snackMessage = `Person ${person.FirstName} ${person.LastName} deleted successfully`;
		snackbarWithoutClose.open();
		people = people.filter((p) => p['Auto ID'] != person['Auto ID']);
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
						<IconButton ><CommonIcon class="material-icons">arrow_upward</CommonIcon></IconButton>
					</Cell>
					<Cell columnId="email">
						<Label>Email</Label>
						<IconButton ><CommonIcon class="material-icons">arrow_upward</CommonIcon></IconButton>
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
							><IconButton
								type="button"
								aria-label="Delete person"
								data-testid="delete-person"
								onclick={() => deletePerson(item)}
								><CommonIcon class="material-icons" aria-hidden="true">delete</CommonIcon
								></IconButton
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
