<script lang="ts">
	import { page } from '$app/state';
	import type { person as PersonRow } from '#lib/types/rows.js';
	import PersonForm from '../../../components/PersonForm.svelte';

	let person = {
		'Auto ID': 0,
		Id: null,
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
		ClientAgreementSigned: false,
		'Joined Date': '',
		Haemophilia: false,
		Pregnant: false,
		'Give Blood': false,
		Signed: false,
		Epilepsy: false,
		Pacemaker: false,
		'Full Name': ''
	} satisfies PersonRow;
</script>

<PersonForm supabase={page.data.supabase} {person} onSave={() => history.back()} />
