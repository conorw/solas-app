<script lang="ts">
	import { DateTime } from 'luxon';

	interface Props {
		onChange: (date: Date) => void;
		selected: Date;
	}

	let { onChange, selected = $bindable() }: Props = $props();

	let value = $state(DateTime.fromJSDate(selected).toFormat('yyyy-MM-dd'));

	$effect(() => {
		value = DateTime.fromJSDate(selected).toFormat('yyyy-MM-dd');
	});

	function handleInput(event: Event) {
		const next = (event.currentTarget as HTMLInputElement).value;
		if (!next) return;
		value = next;
		const date = DateTime.fromISO(next).toJSDate();
		selected = date;
		onChange(date);
	}
</script>

<input type="date" {value} oninput={handleInput} />
