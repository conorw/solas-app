<script lang="ts">
	import type { PageData } from './$types';
	import Autocomplete from '@smui-extra/autocomplete';
	import Select, { Option } from '@smui/select';

	import { PrimaryText } from '@smui/list';
	import IconButton from '@smui/icon-button';
	import Button, { Label } from '@smui/button';
	import { page } from '$app/stores';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Card, { Content } from '@smui/card';
	import { DateTime } from 'luxon';
	import DatePicker from '../../components/DatePicker.svelte';
	import { goto } from '$app/navigation';

	export let data: PageData;

	let selectedPerson: any | undefined = undefined;
	let selectedService: any | undefined = undefined;
	let selectedDate: any = new Date(data.date) || new Date();
	let attendance: any = [];
	const attendanceFields = `"Auto ID", "Person Name" , "ServiceName"`;

	const updateAttendance = async (date: any) => {
		const attendanceData = await data.supabase
			.from('attendance')
			.select(attendanceFields)
			.eq(`Date`, `${date}`)
			.order(`"Person Name"`, { ascending: true });
		attendance = attendanceData.data?.map((a: any) => {
			return {
				...a,
				'Person Name': capitalizeFirstLetter(a['Person Name'])
			};
		});
	};
	updateAttendance(data.date);

	const deleteAttendance = async (id: string) => {
		const ret = await data.supabase.from('attendance').delete().eq('Auto ID', id);
		if (ret.error) {
			console.log(ret.error);
		} else {
			console.log(ret.data);
			attendance = attendance.filter((a: any) => a['Auto ID'] !== id);
		}
	};

	const updateService = async (attend: any) => {
		const ret = await data.supabase
			.from('attendance')
			.update({ ServiceName: attend.ServiceName })
			.eq('Auto ID', attend['Auto ID']);
		if (ret.error) {
			console.log(ret.error);
		} else {
			attendance = attendance.map((a: any) => {
				if (a['Auto ID'] === attend['Auto ID']) {
					return attend;
				} else {
					return a;
				}
			});
		}
	};

	const addAttendee = async () => {
		console.log('adding', { selectedPerson, selectedDate, selectedService });
		if (!selectedPerson || !selectedDate || !selectedService) {
			alert('Please select a person, date and service');
			return;
		}
		const ret = await data.supabase
			.from('attendance')
			.insert([
				{
					'Person Name': `${selectedPerson.FirstName} ${selectedPerson.LastName}`,
					'Person Id': selectedPerson['Auto ID'],
					ServiceName: selectedService.Name,
					Date: DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd')
				}
			])
			.select(attendanceFields);
		if (ret.error) {
			console.log(ret.error);
		} else {
			console.log(ret.data);
			updateAttendance(DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd'));
			selectedPerson = undefined;
		}
	};

	function capitalizeFirstLetter(str: string) {
		// capitatize first letter of each word in string and return
		return str?.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}
	function getPersonName(person: any) {
		if (!person) return '';
		return person
			? `${capitalizeFirstLetter(person.FirstName)} ${
					capitalizeFirstLetter(person.LastName) || ''
			  } (b.${DateTime.fromISO(person.DateOfBirth).toFormat('yyyy')}) (Accupuncture:${
					person['Acupuncture Data'] || false
			  })`
			: '';
	}
	async function searchItems(input: string) {
		if (!input || input.length < 2) {
			return [];
		}
		const search = input.toLowerCase();
		// Return a list of matches.
		return data.people?.filter((item) => getPersonName(item).toLocaleLowerCase().includes(search));
	}
</script>

<LayoutGrid>
	<Cell span={4}>
		<DatePicker
			onChange={(e) => {
				// selectedDate = e;
				if (e !== selectedDate) {
					selectedDate = e;
					$page.url.searchParams.set('date', DateTime.fromJSDate(e).toFormat('yyyy-MM-dd'));
					goto($page.url.pathname + '?' + $page.url.searchParams.toString());
					updateAttendance(DateTime.fromJSDate(e).toFormat('yyyy-MM-dd'));
				}
			}}
			bind:selected={selectedDate}
		/>
		<h2>Add Attendee</h2>
		<Autocomplete
			style="width: 80%"
			search={searchItems}
			showMenuWithNoInput={false}
			options={data?.people}
			getOptionLabel={(person) => getPersonName(person)}
			bind:value={selectedPerson}
			label="Start Typing Person Name"
		/>
		<IconButton class="material-icons" on:click={() => (selectedPerson = undefined)}
			>clear</IconButton
		>

		<div>
			<Autocomplete
				style="width: 80%"
				options={data?.service}
				getOptionLabel={(service) => (service ? `${service.Name || ''}` : '')}
				bind:value={selectedService}
				label="Service"
			/>
		</div>
		<div>
			<Button on:click={addAttendee} variant="raised">
				<Label>Add Attendee To List ></Label>
			</Button>
		</div>
		<div>
			If user not found. <Button href="/people/new">Add New user</Button>
		</div>
	</Cell>
	<Cell span={8}>
		<h2>
			Attendees on {DateTime.fromJSDate(selectedDate).toLocaleString(
				DateTime.DATE_MED_WITH_WEEKDAY
			)}
		</h2>
		{#if attendance?.length}
			<LayoutGrid>
				{#each attendance as attend}
					<Cell>
						<!-- <IconButton class="material-icons" on:click={() => {}}>delete</IconButton>
							<Text>
								<PrimaryText>{attend['Person Name']}</PrimaryText>
								<SecondaryText>{attend['ServiceName']}</SecondaryText>
							</Text> -->
						<Card>
							<Content
								><PrimaryText
									>{attend['Person Name']}
									<IconButton
										class="material-icons"
										on:click={() => deleteAttendance(attend['Auto ID'])}>delete</IconButton
									></PrimaryText
								>

								<Select
									on:SMUISelect:change={() => updateService(attend)}
									bind:value={attend['ServiceName']}
								>
									{#each data?.service as service}
										<Option value={service.Name}>{service.Name}</Option>
									{/each}
								</Select>
							</Content>
						</Card>
					</Cell>
				{/each}
			</LayoutGrid>
		{/if}
	</Cell>
</LayoutGrid>

<style lang="scss">
	:global {
		.mdc-text-field {
			width: 80%;
		}
		.mdc-select {
			width: 100%;
		}
	}
	.demo-list {
		width: 100%;
		overflow: auto;
	}
</style>
