<script lang="ts">
	import { untrack } from 'svelte';
	import { DateTime } from 'luxon';

	interface Props {
		onChange: (date: Date) => void;
		selected: Date;
	}

	let { onChange, selected = $bindable() }: Props = $props();

	const min = DateTime.fromObject({ year: 1900, month: 1, day: 1 }).startOf('day');
	const max = DateTime.fromObject({ year: 2100, month: 12, day: 31 }).endOf('day');

	let open = $state(false);
	let browse = $state(DateTime.fromJSDate(selected).startOf('month'));
	let rootEl: HTMLDivElement | undefined = $state();

	let lastEmitted = untrack(() => selected?.getTime() ?? null);

	$effect(() => {
		const date = selected;
		const t = date?.getTime() ?? null;
		if (t === null || t === lastEmitted) return;
		lastEmitted = t;
		onChange(date);
	});

	$effect(() => {
		if (open) {
			browse = DateTime.fromJSDate(selected).startOf('month');
		}
	});

	const displayText = $derived(DateTime.fromJSDate(selected).toFormat('dd/MM/yyyy'));
	const sidebarText = $derived(DateTime.fromJSDate(selected).toFormat('ccc, d LLL yyyy'));
	const monthLabel = $derived(browse.toFormat('MMMM yyyy'));

	const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	type DayCell = {
		date: DateTime;
		inMonth: boolean;
		selected: boolean;
		disabled: boolean;
	};

	const days = $derived.by(() => {
		// Luxon weeks start on Monday; match the old Sunday-first grid.
		const monthStart = browse.startOf('month');
		const gridStart = monthStart.minus({ days: monthStart.weekday % 7 });
		const selectedDay = DateTime.fromJSDate(selected).startOf('day');
		const cells: DayCell[] = [];
		for (let i = 0; i < 42; i++) {
			const date = gridStart.plus({ days: i }).startOf('day');
			cells.push({
				date,
				inMonth: date.month === browse.month && date.year === browse.year,
				selected: date.hasSame(selectedDay, 'day'),
				disabled: date < min || date > max
			});
		}
		const lastWeek = cells.slice(35);
		if (lastWeek.every((d) => !d.inMonth)) {
			return cells.slice(0, 35);
		}
		return cells;
	});

	function emit(date: DateTime) {
		const js = date.toJSDate();
		selected = js;
		lastEmitted = js.getTime();
		onChange(js);
		open = false;
	}

	function selectDay(cell: DayCell) {
		if (cell.disabled) return;
		if (!cell.inMonth) {
			browse = cell.date.startOf('month');
		}
		emit(cell.date);
	}

	function prevMonth() {
		browse = browse.minus({ months: 1 }).startOf('month');
	}

	function nextMonth() {
		browse = browse.plus({ months: 1 }).startOf('month');
	}

	function onDocPointerDown(event: PointerEvent) {
		if (!open || !rootEl) return;
		if (!rootEl.contains(event.target as Node)) {
			open = false;
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			open = false;
			event.stopPropagation();
		}
	}

	$effect(() => {
		if (!open) return;
		document.addEventListener('pointerdown', onDocPointerDown);
		return () => document.removeEventListener('pointerdown', onDocPointerDown);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="solas-datepicker" bind:this={rootEl} onkeydown={onKeydown}>
	<button
		type="button"
		class="solas-datepicker__trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		{displayText}
	</button>

	{#if open}
		<div class="solas-datepicker__popup" role="dialog" aria-label="Choose date">
			<div class="solas-datepicker__calendar">
				<div class="solas-datepicker__header">
					<button type="button" class="solas-datepicker__nav" aria-label="Previous month" onclick={prevMonth}>
						<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
							><path
								fill="currentColor"
								d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
							/></svg
						>
					</button>
					<div class="solas-datepicker__month">{monthLabel}</div>
					<button type="button" class="solas-datepicker__nav" aria-label="Next month" onclick={nextMonth}>
						<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
							><path
								fill="currentColor"
								d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
							/></svg
						>
					</button>
				</div>

				<div class="solas-datepicker__weekdays">
					{#each weekdayLabels as label}
						<div class="solas-datepicker__weekday">{label}</div>
					{/each}
				</div>

				<div class="solas-datepicker__grid">
					{#each days as cell}
						<button
							type="button"
							class="solas-datepicker__day"
							class:solas-datepicker__day--outside={!cell.inMonth}
							class:solas-datepicker__day--selected={cell.selected}
							disabled={cell.disabled}
							aria-pressed={cell.selected}
							aria-label={cell.date.toFormat('cccc, d MMMM yyyy')}
							onclick={() => selectDay(cell)}
						>
							{cell.date.day}
						</button>
					{/each}
				</div>
			</div>

			<aside class="solas-datepicker__sidebar">
				<div class="solas-datepicker__sidebar-accent"></div>
				<div class="solas-datepicker__sidebar-date">{sidebarText}</div>
			</aside>
		</div>
	{/if}
</div>

<style>
	.solas-datepicker {
		position: relative;
		display: inline-block;
		font-family: Roboto, system-ui, sans-serif;
	}

	.solas-datepicker__trigger {
		min-width: 7.5rem;
		padding: 0.45rem 0.65rem;
		border: 1px solid rgba(103, 113, 137, 0.35);
		border-radius: 3px;
		background: #fff;
		color: #222;
		font: inherit;
		font-size: 0.95rem;
		text-align: left;
		cursor: pointer;
	}

	.solas-datepicker__trigger:focus-visible {
		outline: none;
		border-color: #ff6a00;
		box-shadow: 0 0 0 2px rgba(255, 106, 0, 0.35);
	}

	.solas-datepicker__popup {
		position: absolute;
		z-index: 40;
		top: calc(100% + 6px);
		left: 0;
		display: grid;
		grid-template-columns: minmax(22rem, 1fr) 9rem;
		width: min(40rem, calc(100vw - 1.5rem));
		background: #fff;
		border-radius: 2px;
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
		overflow: hidden;
	}

	.solas-datepicker__calendar {
		padding: 0.75rem 0.85rem 1rem;
		background: #fff;
	}

	.solas-datepicker__header {
		display: grid;
		grid-template-columns: 2.5rem 1fr 2.5rem;
		align-items: center;
		margin-bottom: 0.65rem;
	}

	.solas-datepicker__month {
		text-align: center;
		font-size: 1.05rem;
		font-weight: 500;
		color: #3a3a3a;
	}

	.solas-datepicker__nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #555;
		cursor: pointer;
	}

	.solas-datepicker__nav:hover {
		background: rgba(0, 0, 0, 0.06);
	}

	.solas-datepicker__weekdays,
	.solas-datepicker__grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.solas-datepicker__weekday {
		padding: 0.35rem 0;
		text-align: center;
		font-size: 0.78rem;
		color: #9a9a9a;
	}

	.solas-datepicker__day {
		aspect-ratio: 1;
		min-height: 3.4rem;
		margin: 0;
		padding: 0;
		border: 1px solid #ececec;
		margin-right: -1px;
		margin-bottom: -1px;
		background: #fff;
		color: #333;
		font: inherit;
		font-size: 1.15rem;
		cursor: pointer;
	}

	.solas-datepicker__day:hover:not(:disabled):not(.solas-datepicker__day--selected) {
		background: #f5f5f5;
	}

	.solas-datepicker__day--outside {
		color: #b0b0b0;
		background: #f3f3f3;
	}

	.solas-datepicker__day--selected {
		background: #ff6a00;
		border-color: #ff6a00;
		color: #fff;
		font-weight: 600;
		z-index: 1;
	}

	.solas-datepicker__day:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.solas-datepicker__sidebar {
		position: relative;
		background: #111;
		color: #fff;
		padding: 1.25rem 0.85rem 1rem;
		min-height: 100%;
	}

	.solas-datepicker__sidebar-accent {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 0.45rem;
		background: #ff6a00;
	}

	.solas-datepicker__sidebar-date {
		margin-top: 0.85rem;
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.35;
		word-break: break-word;
	}

	@media (max-width: 520px) {
		.solas-datepicker__popup {
			grid-template-columns: 1fr;
			width: min(22rem, calc(100vw - 1.5rem));
		}

		.solas-datepicker__sidebar {
			min-height: auto;
			padding-bottom: 1rem;
		}

		.solas-datepicker__day {
			min-height: 2.6rem;
		}
	}
</style>
