<script lang="ts">
	import { goto } from '$app/navigation';
	import type { person } from '$lib/types/rows';
	import PersonForm from '../../../components/PersonForm.svelte';

	let person: person = {
		FirstName: '',
		LastName: '',
		DateOfBirth: '1980-01-01',
		Phone: '',
		'Acupuncture Data': false,
		Email: '',
		'Auto ID': null,
		'Created At': null,
		'Updated At': null,
		'Referral Source': null,
		'Equality Opt Out': null,
		Gender: 'Female',
		Town: 'Ballycastle',
		Postcode: 'BT54',
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
		'Full Name': ''
	};
</script>

<PersonForm {person} onSave={()=>history.back()} />
