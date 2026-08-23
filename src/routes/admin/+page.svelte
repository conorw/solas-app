<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/admin/stats', { replaceState: true });
	});
</script>

<p class="admin-redirect">Opening admin stats…</p>

<style>
	.admin-redirect {
		padding: 2rem 1.25rem;
		text-align: center;
		opacity: 0.7;
	}
</style>
