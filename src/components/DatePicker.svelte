<script lang="ts">
	import { Datepicker } from 'svelte-calendar';
	export let onChange: any;

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

	let store: any;

    export let selected: Date;

    console.log('selected', selected);

	$: $store?.selected ? onChange($store?.selected) : () => {};
</script>

<Datepicker format={'DD/MM/YYYY'} selected={selected} bind:store />
