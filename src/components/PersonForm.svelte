<script lang="ts">
	import type { person as PersonRow } from '#lib/types/rows.js';
	import Snackbar, { Actions } from '@smui/snackbar';
	import IconButton from '@smui/icon-button';
	import Button, { Icon, Label } from '@smui/button';
	import { Icon as CommonIcon } from '@smui/common';
	import Select, { Option } from '@smui/select';
	import Textfield from '@smui/textfield';
	import { DateTime } from 'luxon';
	import DatePicker from './DatePicker.svelte';
	import Checkbox from '@smui/checkbox';
	import FormField from '@smui/form-field';

	interface Props {
		person: PersonRow;
		onSave: () => void;
		supabase: any;
		/** Optional page heading; defaults from create vs edit. */
		title?: string;
	}

	let { person = $bindable(), onSave, supabase, title }: Props = $props();

	let snackbar: Snackbar;
	let snackText = $state('Saved.');
	let snackTimeout = $state(4000);
	let saving = $state(false);
	let formError = $state('');
	let equalityOptOut = $state(Boolean(person['Equality Opt Out']));

	const isNew = $derived(!person['Auto ID'] || person['Auto ID'] <= 0);
	const heading = $derived(
		title ??
			(isNew
				? 'Add person'
				: `Edit ${person.FirstName || ''} ${person.LastName || ''}`.trim() || 'Edit person')
	);

	const dobSelected = $derived(
		person?.DateOfBirth
			? DateTime.fromISO(person.DateOfBirth).toJSDate()
			: new Date('1980-01-01')
	);

	function showSnack(message: string, sticky = false) {
		snackText = message;
		snackTimeout = sticky ? -1 : 4000;
		snackbar?.open();
	}

	function onDobChange(e: Date) {
		const isoDate = DateTime.fromJSDate(e).toFormat('yyyy-MM-dd');
		if (isoDate !== person.DateOfBirth) {
			person.DateOfBirth = isoDate;
		}
	}

	function onTextInput(field: 'FirstName' | 'LastName', event: Event) {
		person[field] = (event.currentTarget as HTMLInputElement).value;
	}

	function cancel() {
		history.back();
	}

	async function save() {
		formError = '';
		const first = (person.FirstName ?? '').trim();
		const last = (person.LastName ?? '').trim();
		if (!first || !last) {
			formError = 'First name and last name are required.';
			showSnack(formError, true);
			return;
		}
		person.FirstName = first;
		person.LastName = last;
		person['Equality Opt Out'] = equalityOptOut;

		const payload =
			person['Auto ID'] && person['Auto ID'] > 0
				? person
				: (() => {
						const { 'Auto ID': _id, ...rest } = person;
						return rest;
					})();

		saving = true;
		const ret = await supabase.from('people').upsert(payload);
		saving = false;

		if (ret.error) {
			formError = ret.error.message;
			showSnack(ret.error.message, true);
			return;
		}
		showSnack('Saved successfully');
		onSave();
	}
</script>

<div class="person-form">
	<header class="person-form__header">
		<div class="person-form__heading">
			<Button variant="outlined" class="back-btn" onclick={cancel} disabled={saving}>
				<Icon class="material-icons">arrow_back</Icon>
				<Label>Back</Label>
			</Button>
			<h1>{heading}</h1>
		</div>
		{#if formError}
			<p class="form-error" role="alert">{formError}</p>
		{/if}
	</header>

	<section class="form-section">
		<h2 class="form-section__title">Basics</h2>
		<div class="form-grid">
			<Textfield
				class="field"
				bind:value={person.FirstName}
				label="First Name"
				required
				input$oninput={(e) => onTextInput('FirstName', e)}
				input$onchange={(e) => onTextInput('FirstName', e)}
			/>
			<Textfield
				class="field"
				bind:value={person.LastName}
				label="Last Name"
				required
				input$oninput={(e) => onTextInput('LastName', e)}
				input$onchange={(e) => onTextInput('LastName', e)}
			/>
			<div class="field field--dob">
				<span class="field-label" id="dob-label">Date of Birth</span>
				<DatePicker selected={dobSelected} onChange={onDobChange} />
			</div>
			<Select class="field" label="Gender" bind:value={person.Gender}>
				<Option value="" />
				<Option value="Female">Female</Option>
				<Option value="Male">Male</Option>
				<Option value="Other">Other</Option>
			</Select>
		</div>
	</section>

	<section class="form-section">
		<h2 class="form-section__title">Contact</h2>
		<div class="form-grid">
			<Textfield class="field" type="phone" bind:value={person.Phone} label="Phone" />
			<Textfield class="field" type="email" bind:value={person.Email} label="Email" />
			<Textfield class="field" bind:value={person.Town} label="Town" />
			<Textfield class="field" bind:value={person.Postcode} label="Postcode" />
		</div>
	</section>

	<section class="form-section">
		<h2 class="form-section__title">Referral & support</h2>
		<div class="form-grid">
			<Select
				class="field field--wide"
				label="How did you Hear about Solas?"
				bind:value={person['Referral Source']}
			>
				<Option value="" />
				<Option value="Personal Recommendation">Personal Recommendation</Option>
				<Option value="Word Of Mouth">Word Of Mouth</Option>
				<Option value="GP">GP</Option>
				<Option value="Other Organisation">Other Organisation</Option>
				<Option value="Marketing">Marketing</Option>
				<Option value="Other">Other (Please Specify)</Option>
			</Select>
			<Select
				class="field field--wide"
				label="Other Support?"
				bind:value={person['Other Support']}
			>
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
			<Textfield
				class="field field--wide"
				textarea
				bind:value={person.OtherInfo}
				label="Other Info"
			/>
		</div>
		<div class="flag-grid">
			<FormField>
				<Checkbox bind:checked={person['Marketing Opt Out']} />
				{#snippet label()}Marketing opt out{/snippet}
			</FormField>
			<FormField>
				<Checkbox bind:checked={person.Carer} />
				{#snippet label()}Carer{/snippet}
			</FormField>
			<FormField>
				<Checkbox bind:checked={person.Disability} />
				{#snippet label()}Disability{/snippet}
			</FormField>
			<FormField>
				<Checkbox bind:checked={person.ClientAgreementSigned} />
				{#snippet label()}Client agreement signed{/snippet}
			</FormField>
		</div>
	</section>

	<section class="form-section">
		<h2 class="form-section__title">Equality data</h2>
		<div class="flag-grid">
			<FormField>
				<Checkbox bind:checked={equalityOptOut} />
				{#snippet label()}Equality opt out{/snippet}
			</FormField>
		</div>
		{#if !equalityOptOut}
			<div class="form-grid">
				<Select class="field" label="Religion" bind:value={person.Religion}>
					<Option value="" />
					<Option value="Catholic">Catholic</Option>
					<Option value="None">None</Option>
					<Option value="Other">Other</Option>
					<Option value="Protestant">Protestant</Option>
				</Select>
				<Select class="field" label="Ethnic Origin" bind:value={person['Ethnic Origin']}>
					<Option value="" />
					<Option value="Black">Black</Option>
					<Option value="White">White</Option>
					<Option value="Chinese">Chinese</Option>
					<Option value="Indian">Indian</Option>
					<Option value="Irish Traveller">Irish Traveller</Option>
					<Option value="Other">Other</Option>
				</Select>
				<Select
					class="field"
					label="Sexual Orientation"
					bind:value={person['Sexual Orientation']}
				>
					<Option value="" />
					<Option value="Bisexual">Bisexual</Option>
					<Option value="Hetrosexual">Hetrosexual</Option>
					<Option value="Homosexual">Homosexual</Option>
					<Option value="Other">Other</Option>
				</Select>
				<Select class="field" label="Marital Status" bind:value={person['Marital Status']}>
					<Option value="" />
					<Option value="Civil Partnership">Civil Partnership</Option>
					<Option value="Co-habiting">Co-habiting</Option>
					<Option value="Married">Married</Option>
					<Option value="Divorced">Divorced</Option>
					<Option value="Single">Single</Option>
					<Option value="Widowed">Widowed</Option>
				</Select>
			</div>
		{:else}
			<p class="section-note">Equality questions are hidden because opt out is selected.</p>
		{/if}
	</section>

	<section class="form-section">
		<h2 class="form-section__title">Acupuncture</h2>
		<div class="flag-grid">
			<FormField>
				<Checkbox bind:checked={person['Acupuncture Data']} />
				{#snippet label()}Collect acupuncture data{/snippet}
			</FormField>
		</div>
		{#if person['Acupuncture Data']}
			<div class="flag-grid">
				<FormField>
					<Checkbox bind:checked={person.Haemophilia} />
					{#snippet label()}Haemophilia{/snippet}
				</FormField>
				<FormField>
					<Checkbox bind:checked={person.Pregnant} />
					{#snippet label()}Pregnant{/snippet}
				</FormField>
				<FormField>
					<Checkbox bind:checked={person['Give Blood']} />
					{#snippet label()}Gives blood regularly{/snippet}
				</FormField>
				<FormField>
					<Checkbox bind:checked={person['Epilepsy']} />
					{#snippet label()}Epilepsy{/snippet}
				</FormField>
				<FormField>
					<Checkbox bind:checked={person['Pacemaker']} />
					{#snippet label()}Pacemaker{/snippet}
				</FormField>
				<FormField>
					<Checkbox bind:checked={person.Signed} />
					{#snippet label()}Signed{/snippet}
				</FormField>
			</div>
		{/if}
	</section>

	<footer class="person-form__footer">
		<Button variant="outlined" class="footer-btn" onclick={cancel} disabled={saving}>
			<Label>Cancel</Label>
		</Button>
		<Button
			variant="unelevated"
			class="footer-btn footer-btn--primary"
			onclick={save}
			disabled={saving}
		>
			<Icon class="material-icons">save</Icon>
			<Label>{saving ? 'Saving…' : 'Save'}</Label>
		</Button>
	</footer>
</div>

<Snackbar bind:this={snackbar} timeoutMs={snackTimeout}>
	<Label>{snackText}</Label>
	<Actions>
		<IconButton title="Dismiss">
			<CommonIcon class="material-icons">close</CommonIcon>
		</IconButton>
	</Actions>
</Snackbar>

<style lang="scss">
	.person-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 1.25rem 6.5rem;
		max-width: 52rem;
		margin: 0 auto;
	}

	.person-form__header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.person-form__heading {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;

		h1 {
			margin: 0;
			font-size: 1.5rem;
			font-weight: 600;
			line-height: 1.2;
		}
	}

	:global(.back-btn) {
		min-height: 2.5rem;
	}

	.form-error {
		margin: 0;
		color: var(--mdc-theme-error, #b00020);
		font-size: 0.95rem;
	}

	.form-section {
		padding: 1rem 1.1rem 1.15rem;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		background: var(--mdc-theme-surface, transparent);
	}

	.form-section__title {
		margin: 0 0 0.85rem;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.section-note {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		opacity: 0.7;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.85rem 1rem;
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}

	:global(.field),
	:global(.field .mdc-text-field),
	:global(.field.mdc-select) {
		width: 100%;
	}

	:global(.field--wide) {
		grid-column: 1 / -1;
	}

	.field--dob {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		justify-content: flex-end;
	}

	.field-label {
		font-size: 0.75rem;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		opacity: 0.7;
		font-weight: 500;
	}

	.flag-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: 0.35rem 1rem;
		margin-top: 0.85rem;
	}

	.flag-grid:first-child {
		margin-top: 0;
	}

	.person-form__footer {
		position: sticky;
		bottom: 0;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.65rem;
		margin: 0 -1.25rem -6.5rem;
		padding: 0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
		border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: color-mix(in srgb, var(--mdc-theme-surface, #fff) 92%, transparent);
		backdrop-filter: blur(8px);
	}

	:global(.footer-btn) {
		min-height: 3rem;
		min-width: 7rem;
	}

	:global(.footer-btn--primary) {
		min-width: 10rem;
	}

	@media (prefers-color-scheme: dark) {
		.form-section {
			background: var(--mdc-theme-surface, #212121);
		}

		.person-form__footer {
			background: color-mix(in srgb, #212121 92%, transparent);
		}
	}
</style>
