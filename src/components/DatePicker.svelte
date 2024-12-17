<script lang="ts">
	import { run } from 'svelte/legacy';

	import { Datepicker } from 'svelte-calendar';

	// const theme = {
	// 	calendar: {
	// 		width: '600px',
	// 		shadow: '0px 0px 5px rgba(0, 0, 0, 0.25)',
	//         colors: {
	// 			background: {
	// 				highlight: '#68B096'
	// 			}
	// 		}
	// 	}
	// };

	let store: any = $state();

	interface Props {
		onChange: any;
		selected: Date;
	}

	let { onChange, selected = $bindable() }: Props = $props();

	run(() => {
		$store?.selected ? onChange($store?.selected) : () => {};
	});
</script>

<Datepicker format={'DD/MM/YYYY'} {selected} bind:store />
