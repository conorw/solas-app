<script lang="ts">
	import DataTable, { Head, Body, Row, Cell, Label, SortValue } from '@smui/data-table';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<DataTable table$aria-label="User list" style="width: 100%;height:90%">
	<Head>
		<Row>
			<Cell columnId="Id">
				<Label>Id</Label>
			</Cell>
			<Cell columnId="firstname" >
				<Label>First Name</Label>
			</Cell>
            <Cell columnId="lastname">
				<Label>Last Name</Label>
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
		{#each data?.people as item}
			<Row>
				<Cell>{item?.Id}</Cell>
				<Cell>{item.FirstName}</Cell>
                <Cell>{item.LastName}</Cell>
                <!-- 
        <Cell>{item.username}</Cell>
        <Cell>{item.email}</Cell>
        <Cell>{item.website}</Cell> -->
			</Row>
		{/each}
	</Body>
</DataTable>
