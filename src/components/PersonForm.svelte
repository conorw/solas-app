<!-- @migration-task Error while migrating Svelte code: Identifier 'person' has already been declared -->
<script lang="ts">
	import type { person } from '$lib/types/rows';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Snackbar, { Actions } from '@smui/snackbar';
	import IconButton from '@smui/icon-button';
	import Button, { Icon } from '@smui/button';
	import Select, { Option } from '@smui/select';
	import Textfield from '@smui/textfield';
	import { DateTime } from 'luxon';
	import DatePicker from './DatePicker.svelte';
	import Checkbox from '@smui/checkbox';
	import FormField from '@smui/form-field';
	let snackbar: Snackbar;
	let text = 'Saved.';
	import { Label } from '@smui/list';
	export let person: person;
	export let onSave: any;
	export let supabase: any;

	const save = async () => {
		supabase
			.from('people')
			.upsert(person)
			.then((ret) => {
				if (ret.error) {
					text = ret.error.message;
					snackbar?.open();
					console.log(ret.error);
				} else {
					text = 'Saved Successfully';
					snackbar?.open();
					onSave();
				}
			});
	};
</script>

<LayoutGrid>
	<Cell>
		<Textfield bind:value={person.FirstName} label="First Name" />
	</Cell>
	<Cell>
		<Textfield bind:value={person.LastName} label="Last Name" />
	</Cell>
	<Cell>
		<Label>Date of Birth</Label>
		<DatePicker
			selected={person?.DateOfBirth
				? DateTime.fromISO(person?.DateOfBirth || '').toJSDate()
				: new Date('1970-01-01')}
			onChange={(e) => {
				const isoDate = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
				if (isoDate !== person?.DateOfBirth) {
					console.log(e);
					person.DateOfBirth = isoDate;
				}
			}}
		/>
	</Cell>
	<Cell>
		<Textfield type="phone" bind:value={person.Phone} label="Phone" />
	</Cell>
	<Cell>
		<Select label="Gender" bind:value={person.Gender}>
			<Option value="" />
			<Option value="Female">Female</Option>
			<Option value="Male">Male</Option>
			<Option value="Other">Other</Option>
		</Select>
	</Cell>
	<Cell>
		<Textfield bind:value={person.Town} label="Town" />
	</Cell>
	<Cell>
		<Textfield bind:value={person.Postcode} label="Postcode" />
	</Cell>
	<Cell>
		<Textfield type="email" bind:value={person.Email} label="Email" />
	</Cell>
	<Cell>
		<Select label="How did you Hear about Solas?" bind:value={person['Referral Source']}>
			<Option value="" />
			<Option value="Personal Recommendation">Personal Recommendation</Option>
			<Option value="Word Of Mouth">Word Of Mouth</Option>
			<Option value="GP">GP</Option>
			<Option value="Other Organisation">Other Organisation</Option>
			<Option value="Marketing">Marketing</Option>
			<Option value="Other">Other (Please Specify)</Option>
		</Select>
	</Cell>
	<Cell>
		<Select label="Other Support?" bind:value={person['Other Support']}>
			<Option value="" />
			<Option value="BCW">BCW</Option>
			<Option value="CAT">CAT</Option>
			<Option value="CCGBD">CCGBD</Option>
			<Option value="CMHT">CMHT</Option>
			<Option value="MHP">MHP</Option>
			<Option value="GP">GP</Option>
			<Option value="Mindwise">Mindwise</Option>
			<Option value="Inspire">Inspire</Option>
			<Option value="District Nurse">District Nurse</Option>
			<Option value="Health Visitor">Health Visitor</Option>
			<Option value="Social Worker">Social Worker</Option>
			<Option value="Livingwell Moyle">Livingwell Moyle</Option>
			<Option value="Good Morning Ballycastle">Good Morning Ballycastle</Option>
			<Option value="Alzhiemer’s Society">Alzhiemer’s Society</Option>
			<Option value="Day Services LD">Day Services LD</Option>
			<Option value="Extern">Extern</Option>
			<Option value="Carer’s Hub">Carer’s Hub</Option>
			<Option value="Other (please specify)">Other (please specify)</Option>
		</Select>
	</Cell>
	<Cell>
		<Textfield textarea bind:value={person.OtherInfo} label="Other Info" />
	</Cell>
	<Cell>
		<FormField>
			<Checkbox bind:checked={person['Marketing Opt Out']} />
			{#snippet label()}Marketing Opt Out{/snippet}
		</FormField>
	</Cell>
	<Cell>
		<FormField>
			<Checkbox bind:checked={person.Carer} />
			{#snippet label()}Carer?{/snippet}
		</FormField>
	</Cell>
	<Cell>
		<FormField>
			<Checkbox bind:checked={person.Disability} />
			{#snippet label()}Disability?{/snippet}
		</FormField>
	</Cell>
	<Cell>
		<FormField>
			<Checkbox bind:checked={person.ClientAgreementSigned} />
			{#snippet label()}Client Agreement Signed?{/snippet}
		</FormField>
	</Cell>
</LayoutGrid>
<h2>Equality Data</h2>
<LayoutGrid>
	<Cell>
		<FormField>
			<Checkbox bind:checked={person['Equality Opt Out']} />
			{#snippet label()}Equality Opt Out{/snippet}
		</FormField>
	</Cell>

	{#if !person['Equality Opt Out']}
		<Cell>
			<Select label="Religion" bind:value={person.Religion}>
				<Option value="" />
				<Option value="Catholic">Catholic</Option>
				<Option value="None">None</Option>
				<Option value="Other">Other</Option>
				<Option value="Protestant">Protestant</Option>
			</Select>
		</Cell>
		<Cell>
			<Select label="Ethnic Origin" bind:value={person['Ethnic Origin']}>
				<Option value="" />
				<Option value="Black">Black</Option>
				<Option value="White">White</Option>
				<Option value="Chinese">Chinese</Option>
				<Option value="Indian">Indian</Option>
				<Option value="Irish Traveller">Irish Traveller</Option>
				<Option value="Other">Other</Option>
			</Select>
		</Cell>
		<Cell>
			<Select label="Sexual Orientation" bind:value={person['Sexual Orientation']}>
				<Option value="" />
				<Option value="Bisexual">Bisexual</Option>
				<Option value="Hetrosexual">Hetrosexual</Option>
				<Option value="Homosexual">Homosexual</Option>
				<Option value="Other">Other</Option>
			</Select>
		</Cell>
		<Cell>
			<Select label="Marital Status" bind:value={person['Marital Status']}>
				<Option value="" />
				<Option value="Civil Partnership">Civil Partnership</Option>
				<Option value="Co-habiting">Co-habiting</Option>
				<Option value="Married">Married</Option>
				<Option value="Divorced">Divorced</Option>
				<Option value="Single">Single</Option>
				<Option value="Widowed">Widowed</Option>
			</Select>
		</Cell>
	{/if}
</LayoutGrid>
<h2>Acupuncture data</h2>
<LayoutGrid>
	<Cell>
		<FormField>
			<Checkbox bind:checked={person['Acupuncture Data']} />
			{#snippet label()}Acupuncture data?{/snippet}
		</FormField>
	</Cell>
	{#if person['Acupuncture Data']}
		<Cell>
			<FormField>
				<Checkbox bind:checked={person.Haemophilia} />
				{#snippet label()}Haemophilia?{/snippet}
			</FormField>
		</Cell>
		<Cell>
			<FormField>
				<Checkbox bind:checked={person.Pregnant} />
				{#snippet label()}Pregnant?{/snippet}
			</FormField>
		</Cell>
		<Cell>
			<FormField>
				<Checkbox bind:checked={person['Give Blood']} />
				{#snippet label()}Gives blood regulary?{/snippet}
			</FormField>
		</Cell>
		<Cell>
			<FormField>
				<Checkbox bind:checked={person['Epilepsy']} />
				{#snippet label()}Epilepsy?{/snippet}
			</FormField>
		</Cell>
		<Cell>
			<FormField>
				<Checkbox bind:checked={person['Pacemaker']} />
				{#snippet label()}Pacemaker?{/snippet}
			</FormField>
		</Cell>
		<Cell>
			<FormField>
				<Checkbox bind:checked={person.Signed} />
				{#snippet label()}Signed?{/snippet}
			</FormField>
		</Cell>
	{/if}
	<Cell span={12}>
		<Button style="width: 100%;" onclick={save} variant="unelevated" class="button-shaped-round">
			<Icon class="material-icons">save</Icon>
			<Label>Save</Label>
		</Button>
	</Cell>
</LayoutGrid>
<Snackbar bind:this={snackbar} timeoutMs={-1}>
	<Label>{text}</Label>
	<Actions>
		<IconButton class="material-icons" title="Dismiss">close</IconButton>
	</Actions>
</Snackbar>
