<!-- @migration-task Error while migrating Svelte code: Identifier 'person' has already been declared -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { person } from '$lib/types/rows';
	import PersonForm from '../../../components/PersonForm.svelte';

	let person: person = {
		FirstName: '',
		LastName: '',
		DateOfBirth: '1980-01-01',
		Phone: '',
		'Acupuncture Data': false,
		Email: '',
		'Created At': null,
		'Updated At': null,
		'Referral Source': null,
		'Equality Opt Out': null,
		Gender: 'Female',
		Town: '',
		Postcode: '',
		'Other Support': '',
		'Marketing Opt Out': false,
		UniqueId: null,
		OtherInfo: '',
		Religion: '',
		'Ethnic Origin': '',
		'Sexual Orientation': '',
		'Marital Status': '',
		Carer: false,
		Disability: false,
		'Joined Date': '',
		Haemophilia: false,
		Pregnant: false,
		'Give Blood': false,
		Signed: false,
		Eplepsy: false,
		Pacemaker: false,
		'Full Name': ''
	};
</script>

<PersonForm supabase={$page.data.supabase} {person} onSave={() => history.back()} />
