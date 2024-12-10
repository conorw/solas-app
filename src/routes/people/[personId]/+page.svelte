<script lang="ts">
	import { page } from '$app/stores';
	import PersonForm from '../../../components/PersonForm.svelte';
	import type { PageData } from './$types';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<PersonForm supabase={$page.data.supabase} onSave={() => history.back()} person={data?.person} />
