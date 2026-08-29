<script lang="ts">
	import { page } from '$app/state';
	import PersonForm from '../../../components/PersonForm.svelte';
	import type { person as PersonRow } from '#lib/types/rows.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let person = $state<PersonRow>({ ...data.person });
</script>

<PersonForm
	supabase={page.data.supabase}
	bind:person
	onSave={() => history.back()}
	title="Edit person"
/>
