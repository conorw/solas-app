<script lang="ts">
	import PersonForm from '../../../components/PersonForm.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<PersonForm onSave={()=>history.back()} person={data?.person}>

</PersonForm>
