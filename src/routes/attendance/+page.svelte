<script lang="ts">
	import type { PageData } from './$types';
	import Autocomplete from '@smui-extra/autocomplete';
	import Select, { Option } from '@smui/select';
	import List, { Item, Text, PrimaryText, SecondaryText } from '@smui/list';
	import IconButton from '@smui/icon-button';
	import { Icon } from '@smui/common';
	import Button, { Label, Icon as ButtonIcon } from '@smui/button';
	import { page } from '$app/state';
	import { DateTime } from 'luxon';
	import DatePicker from '../../components/DatePicker.svelte';
	import { goto } from '$app/navigation';
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import Snackbar from '@smui/snackbar';
	import { ANONYMOUS_PERSON_ID } from '#lib/constants.js';
	import {
		capitalizeFirstLetter,
		getPersonDisplayName,
		getPersonMeta,
		getPersonName
	} from '#lib/person.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let selectedPerson: any | undefined = $state(undefined);
	let selectedService: any | undefined = $state(undefined);
	let selectedDateIso = $state('');

	$effect.pre(() => {
		selectedDateIso = data.date;
	});
	let attendance: any[] = $state([]);
	let open = $state(false);
	let participantCount = $state(10);
	let selectionIndex = $state(-1);
	let selectedMultiService: any = $state(null);
	const services = $derived(data?.service?.filter((s) => !s['Multi']) ?? []);
	const multiServices = $derived(data?.service?.filter((s) => s['Multi']) ?? []);
	const selectedDate = $derived(DateTime.fromISO(selectedDateIso).toJSDate());
	let snackbar: Snackbar;
	let snackMessage = $state('');
	let lastAddedId: number | null = $state(null);
	let formError = $state('');

	const attendanceFields = `"Auto ID", "Person Name", "Person Id", "ServiceName", Multi, TotalAttendees`;

	const canAdd = $derived(!!selectedPerson && !!selectedService && !!selectedDate);
	const isToday = $derived(
		DateTime.fromJSDate(selectedDate).hasSame(DateTime.now(), 'day')
	);

	function showSnack(message: string) {
		snackMessage = message;
		snackbar?.open();
	}

	function navigateToDate(date: Date) {
		const iso = DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
		if (iso === selectedDateIso) {
			return;
		}
		selectedDateIso = iso;
		const url = new URL(page.url.href);
		url.searchParams.set('date', iso);
		goto(`${url.pathname}?${url.searchParams}`);
	}

	function shiftDay(delta: number) {
		navigateToDate(DateTime.fromJSDate(selectedDate).plus({ days: delta }).toJSDate());
	}

	function goToday() {
		navigateToDate(DateTime.now().startOf('day').toJSDate());
	}

	async function addMultiAttendee(service: any, count: number) {
		const ret = await data.supabase
			.from('attendance')
			.insert([
				{
					'Person Name': `Anonymous Attendee`,
					'Person Id': ANONYMOUS_PERSON_ID,
					ServiceName: service.Name,
					Multi: true,
					TotalAttendees: count,
					Date: DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd')
				}
			])
			.select(attendanceFields);
		if (ret.error) {
			showSnack(`Could not add multi event: ${ret.error.message}`);
		} else {
			await updateAttendance(DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd'));
			const added = ret.data?.[0];
			if (added) lastAddedId = added['Auto ID'];
			showSnack(`Added ${count} for ${service.Name}`);
		}
	}

	async function updateAttendance(date: string) {
		const attendanceData = await data.supabase
			.from('attendance')
			.select(attendanceFields)
			.eq(`Date`, `${date}`)
			.order(`"Person Name"`, { ascending: true });
		if (attendanceData.error) {
			showSnack(`Could not load attendance: ${attendanceData.error.message}`);
			return;
		}
		attendance = (attendanceData.data ?? []).map((a: any) => {
			return {
				...a,
				'Person Name': capitalizeFirstLetter(a['Person Name'])
			};
		});
	}

	$effect(() => {
		if (!selectedDateIso) return;
		void updateAttendance(selectedDateIso);
	});

	const deleteAttendance = async (attend: any) => {
		const label = attend.Multi
			? `${attend['ServiceName']} (multi)`
			: attend['Person Name'];
		if (!confirm(`Remove ${label} from this day's attendance?`)) {
			return;
		}
		const ret = await data.supabase.from('attendance').delete().eq('Auto ID', attend['Auto ID']);
		if (ret.error) {
			showSnack(`Could not remove: ${ret.error.message}`);
		} else {
			attendance = attendance.filter((a) => a['Auto ID'] !== attend['Auto ID']);
			showSnack(`Removed ${label}`);
		}
	};

	const updateAttendeeNumber = async (attend: any) => {
		const ret = await data.supabase
			.from('attendance')
			.update({ TotalAttendees: attend.TotalAttendees })
			.eq('Auto ID', attend['Auto ID']);
		if (ret.error) {
			showSnack(`Could not update count: ${ret.error.message}`);
		} else {
			attendance = attendance.map((a) => {
				if (a['Auto ID'] === attend['Auto ID']) {
					return attend;
				} else {
					return a;
				}
			});
		}
	};

	const bumpMultiCount = async (attend: any, delta: number) => {
		const next = Math.max(1, (attend.TotalAttendees ?? 1) + delta);
		attend.TotalAttendees = next;
		await updateAttendeeNumber(attend);
	};

	const updateService = async (attend: any) => {
		const ret = await data.supabase
			.from('attendance')
			.update({ ServiceName: attend.ServiceName })
			.eq('Auto ID', attend['Auto ID']);
		if (ret.error) {
			showSnack(`Could not update service: ${ret.error.message}`);
		} else {
			attendance = attendance.map((a) => {
				if (a['Auto ID'] === attend['Auto ID']) {
					return attend;
				} else {
					return a;
				}
			});
		}
	};

	const addAttendee = async () => {
		formError = '';
		if (!selectedPerson || !selectedDate || !selectedService) {
			formError = 'Select a person and a service to add.';
			return;
		}

		const alreadyOnList = attendance.some(
			(a) => !a.Multi && a['Person Id'] === selectedPerson['Auto ID']
		);
		if (alreadyOnList) {
			const name = getPersonDisplayName(selectedPerson);
			if (!confirm(`${name} is already on this day's list. Add again?`)) {
				return;
			}
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
			showSnack(`Could not add attendee: ${ret.error.message}`);
		} else {
			await updateAttendance(DateTime.fromJSDate(selectedDate).toFormat('yyyy-MM-dd'));
			const added = ret.data?.[0];
			if (added) lastAddedId = added['Auto ID'];
			showSnack(`Added ${getPersonDisplayName(selectedPerson)}`);
			selectedPerson = undefined;
		}
	};

	async function searchPeople(input: string) {
		if (selectedPerson != null) {
			return [selectedPerson];
		}
		const people = data.people ?? [];
		if (!input) {
			return people.slice(0, 40);
		}
		const search = input.toLowerCase();
		return people.filter((item) => getPersonName(item).toLocaleLowerCase().includes(search));
	}

	async function searchServices(input: string) {
		if (selectedService != null) {
			return [selectedService];
		}
		if (!input) {
			return services;
		}
		const search = input.toLowerCase();
		return services.filter((item) => item.Name.toLocaleLowerCase().includes(search));
	}

	function openMultiDialog() {
		selectionIndex = -1;
		selectedMultiService = null;
		participantCount = 10;
		open = true;
	}

	function submitMulti() {
		if (!selectedMultiService || participantCount < 1) {
			showSnack('Select a multi service and a participant count.');
			return;
		}
		addMultiAttendee(selectedMultiService, participantCount);
		open = false;
	}
</script>

<div class="attendance">
	<aside class="check-in-rail">
		<div class="date-controls">
			<div class="date-controls__nav">
				<IconButton aria-label="Previous day" onclick={() => shiftDay(-1)}>
					<Icon class="material-icons">chevron_left</Icon>
				</IconButton>
				<DatePicker
					onChange={(e) => navigateToDate(e)}
					selected={selectedDate}
				/>
				<IconButton aria-label="Next day" onclick={() => shiftDay(1)}>
					<Icon class="material-icons">chevron_right</Icon>
				</IconButton>
			</div>
			{#if !isToday}
				<Button variant="outlined" onclick={goToday} class="date-controls__today">
					<Label>Today</Label>
				</Button>
			{/if}
		</div>

		<h2 class="rail-heading">Add attendee</h2>

		<div class="field-row">
			<Autocomplete
				class="field-grow"
				search={searchPeople}
				showMenuWithNoInput={true}
				getOptionLabel={(person) => getPersonDisplayName(person)}
				bind:value={selectedPerson}
				label="Person name"
			>
				{#snippet match(person)}
					<Text>
						<PrimaryText>{getPersonDisplayName(person)}</PrimaryText>
						<SecondaryText>{getPersonMeta(person)}</SecondaryText>
					</Text>
				{/snippet}
			</Autocomplete>
			<IconButton aria-label="Clear person" onclick={() => (selectedPerson = undefined)}>
				<Icon class="material-icons">clear</Icon>
			</IconButton>
		</div>

		<div class="field-row">
			<Autocomplete
				class="field-grow"
				options={services}
				search={searchServices}
				showMenuWithNoInput={true}
				getOptionLabel={(service) => (service ? `${service.Name || ''}` : '')}
				bind:value={selectedService}
				label="Service"
			/>
			<IconButton aria-label="Clear service" onclick={() => (selectedService = undefined)}>
				<Icon class="material-icons">clear</Icon>
			</IconButton>
		</div>

		{#if formError}
			<p class="form-error" role="alert">{formError}</p>
		{/if}

		<Button
			onclick={addAttendee}
			variant="raised"
			class="add-btn"
			disabled={!canAdd}
		>
			<Label>Add to list</Label>
		</Button>

		<div class="rail-secondary">
			<Button href="/people/new" variant="outlined" class="secondary-btn">
				<ButtonIcon class="material-icons">person_add</ButtonIcon>
				<Label>Add new person</Label>
			</Button>
			<Button onclick={openMultiDialog} variant="outlined" class="secondary-btn">
				<ButtonIcon class="material-icons">groups</ButtonIcon>
				<Label>Add multi event</Label>
			</Button>
		</div>
	</aside>

	<section class="attendee-panel">
		<header class="attendee-panel__header">
			<h2>
				Attendees · {DateTime.fromJSDate(selectedDate).toLocaleString(
					DateTime.DATE_MED_WITH_WEEKDAY
				)}
			</h2>
			<span class="attendee-count">{attendance?.length ?? 0}</span>
		</header>

		{#if attendance?.length}
			<ul class="attendee-list">
				{#each attendance as attend (attend['Auto ID'])}
					<li
						class="attendee-row"
						class:attendee-row--flash={lastAddedId === attend['Auto ID']}
					>
						{#if attend.Multi}
							<div class="attendee-row__info">
								<span class="attendee-row__name">{attend['ServiceName']}</span>
								<span class="attendee-row__meta">Multi event</span>
							</div>
							<div class="stepper" aria-label="Participant count">
								<IconButton
									aria-label="Decrease count"
									onclick={() => bumpMultiCount(attend, -1)}
								>
									<Icon class="material-icons">remove</Icon>
								</IconButton>
								<span class="stepper__value">{attend['TotalAttendees']}</span>
								<IconButton
									aria-label="Increase count"
									onclick={() => bumpMultiCount(attend, 1)}
								>
									<Icon class="material-icons">add</Icon>
								</IconButton>
							</div>
						{:else}
							<div class="attendee-row__info">
								<span class="attendee-row__name">{attend['Person Name']}</span>
							</div>
							<div class="attendee-row__service">
								<Select
									onchange={() => updateService(attend)}
									bind:value={attend['ServiceName']}
									label="Service"
								>
									{#each services as service}
										<Option value={service.Name}>{service.Name}</Option>
									{/each}
								</Select>
							</div>
						{/if}
						<div class="attendee-row__delete">
							<IconButton
								aria-label="Remove attendee"
								onclick={() => deleteAttendance(attend)}
							>
								<Icon class="material-icons">delete</Icon>
							</IconButton>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="empty-state">
				<p>No attendees yet.</p>
				<p class="empty-state__hint">Search for a person on the left to add someone.</p>
			</div>
		{/if}
	</section>
</div>

<Dialog
	bind:open
	selection
	aria-labelledby="list-selection-title"
	aria-describedby="list-selection-content"
>
	<Title id="list-selection-title">Choose multi event</Title>

	<Content id="list-selection-content">
		<div class="stepper stepper--dialog" aria-label="Number of participants">
			<span class="stepper__label">Participants</span>
			<IconButton
				aria-label="Decrease count"
				onclick={() => (participantCount = Math.max(1, participantCount - 1))}
			>
				<Icon class="material-icons">remove</Icon>
			</IconButton>
			<span class="stepper__value">{participantCount}</span>
			<IconButton
				aria-label="Increase count"
				onclick={() => (participantCount += 1)}
			>
				<Icon class="material-icons">add</Icon>
			</IconButton>
		</div>
		<List singleSelection selectedIndex={selectionIndex}>
			{#each multiServices as service, i}
				<Item
					onclick={() => {
						selectionIndex = i;
						selectedMultiService = service;
					}}
					selected={selectionIndex === i}
				>
					<PrimaryText>{service.Name}</PrimaryText>
				</Item>
			{/each}
		</List>
	</Content>
	<Actions>
		<Button
			onclick={() => {
				open = false;
			}}
		>
			<Label>Cancel</Label>
		</Button>
		<Button onclick={submitMulti} action="accept" variant="raised">
			<Label>Add</Label>
		</Button>
	</Actions>
</Dialog>

<Snackbar bind:this={snackbar}>
	<Label>{snackMessage}</Label>
</Snackbar>

<style lang="scss">
	.attendance {
		display: grid;
		grid-template-columns: minmax(18rem, 22rem) minmax(0, 1fr);
		gap: 1.25rem;
		padding: 0.75rem 1rem 1.5rem;
		align-items: start;
		min-height: calc(100dvh - 4rem);
	}

	@media (max-width: 840px) {
		.attendance {
			grid-template-columns: 1fr;
		}

		.check-in-rail {
			position: static;
		}
	}

	.check-in-rail {
		position: sticky;
		top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--mdc-theme-surface, #fff);
		color: var(--mdc-theme-on-surface, inherit);
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		z-index: 2;
	}

	.rail-heading {
		margin: 0.25rem 0 0;
		font-size: 1.15rem;
	}

	.date-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.date-controls__nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	:global(.date-controls__today) {
		align-self: stretch;
	}

	.field-row {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
	}

	:global(.field-grow) {
		flex: 1;
		min-width: 0;
	}

	:global(.field-grow .mdc-text-field) {
		width: 100%;
	}

	.form-error {
		margin: 0;
		color: var(--mdc-theme-error, #b00020);
		font-size: 0.9rem;
	}

	:global(.add-btn) {
		width: 100%;
		min-height: 3rem;
		font-size: 1.05rem;
	}

	.rail-secondary {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.25rem;
		padding-top: 0.75rem;
		border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
	}

	:global(.secondary-btn) {
		width: 100%;
		min-height: 2.75rem;
		justify-content: flex-start;
	}

	.attendee-panel {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: calc(100dvh - 5rem);
	}

	.attendee-panel__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		flex-shrink: 0;

		h2 {
			margin: 0;
			font-size: 1.25rem;
		}
	}

	.attendee-count {
		font-size: 0.95rem;
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}

	.attendee-list {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow: auto;
		flex: 1;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		background: var(--mdc-theme-surface, #fff);
		color: var(--mdc-theme-on-surface, inherit);
	}

	.attendee-row {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(10rem, 1fr) 3rem;
		align-items: center;
		gap: 0.5rem 0.75rem;
		min-height: 3.5rem;
		padding: 0.5rem 0.5rem 0.5rem 0.85rem;
		border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);

		&:last-child {
			border-bottom: none;
		}
	}

	.attendee-row--flash {
		animation: flash-row 1.2s ease-out;
	}

	@keyframes flash-row {
		from {
			background: color-mix(
				in srgb,
				var(--mdc-theme-primary, #ff3e00) 28%,
				transparent
			);
		}
		to {
			background: transparent;
		}
	}

	@media (max-width: 640px) {
		.attendee-row {
			grid-template-columns: minmax(0, 1fr) 3rem;
			grid-template-rows: auto auto;
		}

		.attendee-row__service,
		.stepper {
			grid-column: 1;
		}

		.attendee-row__delete {
			grid-column: 2;
			grid-row: 1 / span 2;
			align-self: center;
		}
	}

	.attendee-row__info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.attendee-row__name {
		font-size: 1.05rem;
		font-weight: 500;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.attendee-row__meta {
		font-size: 0.8rem;
		opacity: 0.65;
	}

	.attendee-row__service {
		min-width: 0;

		:global(.mdc-select) {
			width: 100%;
		}
	}

	.attendee-row__delete {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
	}

	.stepper {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.15rem;
	}

	.stepper--dialog {
		margin-bottom: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.stepper__label {
		width: 100%;
		text-align: center;
		font-size: 0.85rem;
		opacity: 0.75;
		margin-bottom: 0.25rem;
	}

	.stepper__value {
		min-width: 2.5rem;
		text-align: center;
		font-size: 1.25rem;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.empty-state {
		padding: 2.5rem 1.25rem;
		text-align: center;
		border: 1px dashed color-mix(in srgb, currentColor 28%, transparent);
		border-radius: 8px;
		color: color-mix(in srgb, currentColor 72%, transparent);

		p {
			margin: 0;
			font-size: 1.1rem;
		}
	}

	.empty-state__hint {
		margin-top: 0.35rem !important;
		font-size: 0.95rem !important;
		opacity: 0.85;
	}

	@media (prefers-color-scheme: dark) {
		.check-in-rail,
		.attendee-list {
			background: var(--mdc-theme-surface, #212121);
		}
	}
</style>
