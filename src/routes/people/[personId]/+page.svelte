<script lang="ts">
	import { page } from '$app/stores';
	import PersonForm from '../../../components/PersonForm.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<PersonForm supabase={$page.data.supabase} onSave={() => history.back()} person={data?.person} />
