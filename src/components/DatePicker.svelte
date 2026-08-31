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
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const years = Array.from({ length: max.year - min.year + 1 }, (_, i) => max.year - i);

	let open = $state(false);
	let browse = $state(DateTime.fromJSDate(selected).startOf('month'));
	let rootEl: HTMLDivElement | undefined = $state();
	let inputText = $state(DateTime.fromJSDate(selected).toFormat('dd/MM/yyyy'));
	let inputError = $state('');

	let lastEmitted = untrack(() => selected?.getTime() ?? null);

	$effect(() => {
		const date = selected;
		const t = date?.getTime() ?? null;
		if (t === null || t === lastEmitted) return;
		lastEmitted = t;
		inputText = DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
		inputError = '';
		onChange(date);
	});

	$effect(() => {
		if (open) {
			browse = DateTime.fromJSDate(selected).startOf('month');
		}
	});

	const sidebarText = $derived(DateTime.fromJSDate(selected).toFormat('ccc, d LLL yyyy'));
	const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	type DayCell = {
		date: DateTime;
		inMonth: boolean;
		selected: boolean;
		disabled: boolean;
	};

	const days = $derived.by(() => {
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

	function parseTypedDate(raw: string): DateTime | null {
		const text = raw.trim();
		if (!text) return null;
		const formats = ['dd/MM/yyyy', 'd/M/yyyy', 'dd-MM-yyyy', 'd-M-yyyy', 'yyyy-MM-dd'];
		for (const format of formats) {
			const parsed = DateTime.fromFormat(text, format);
			if (parsed.isValid) return parsed.startOf('day');
		}
		return null;
	}

	function emit(date: DateTime) {
		if (date < min || date > max) {
			inputError = 'Date must be between 01/01/1900 and 31/12/2100';
			return;
		}
		const js = date.toJSDate();
		selected = js;
		lastEmitted = js.getTime();
		inputText = date.toFormat('dd/MM/yyyy');
		inputError = '';
		onChange(js);
		open = false;
		browse = date.startOf('month');
	}

	function commitTypedDate() {
		const parsed = parseTypedDate(inputText);
		if (!parsed) {
			inputText = DateTime.fromJSDate(selected).toFormat('dd/MM/yyyy');
			inputError = 'Use dd/mm/yyyy';
			return;
		}
		emit(parsed);
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

	function setBrowseMonth(month: number) {
		browse = browse.set({ month }).startOf('month');
	}

	function setBrowseYear(year: number) {
		browse = browse.set({ year }).startOf('month');
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

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitTypedDate();
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
	<div class="solas-datepicker__field">
		<input
			type="text"
			class="solas-datepicker__input"
			class:solas-datepicker__input--error={!!inputError}
			aria-label="Date"
			aria-invalid={inputError ? 'true' : undefined}
			aria-describedby={inputError ? 'solas-datepicker-error' : undefined}
			placeholder="dd/mm/yyyy"
			autocomplete="bday"
			inputmode="numeric"
			bind:value={inputText}
			onblur={commitTypedDate}
			onkeydown={onInputKeydown}
			onfocus={() => (inputError = '')}
		/>
		<button
			type="button"
			class="solas-datepicker__calendar-btn"
			aria-haspopup="dialog"
			aria-expanded={open}
			aria-label="Open calendar"
			onclick={() => (open = !open)}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
				/>
			</svg>
		</button>
	</div>
	{#if inputError}
		<p id="solas-datepicker-error" class="solas-datepicker__error" role="alert">{inputError}</p>
	{/if}

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
					<div class="solas-datepicker__selectors">
						<label class="solas-datepicker__select-wrap">
							<span class="visually-hidden">Month</span>
							<select
								class="solas-datepicker__select"
								aria-label="Month"
								value={browse.month}
								onchange={(e) => setBrowseMonth(Number(e.currentTarget.value))}
							>
								{#each months as name, i}
									<option value={i + 1}>{name}</option>
								{/each}
							</select>
						</label>
						<label class="solas-datepicker__select-wrap">
							<span class="visually-hidden">Year</span>
							<select
								class="solas-datepicker__select solas-datepicker__select--year"
								aria-label="Year"
								value={browse.year}
								onchange={(e) => setBrowseYear(Number(e.currentTarget.value))}
							>
								{#each years as year}
									<option value={year}>{year}</option>
								{/each}
							</select>
						</label>
					</div>
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
		--dp-surface: var(--mdc-theme-surface, #fff);
		--dp-on-surface: var(--mdc-theme-on-surface, #222);
		--dp-muted: color-mix(in srgb, var(--dp-on-surface) 55%, transparent);
		--dp-border: color-mix(in srgb, var(--dp-on-surface) 16%, transparent);
		--dp-day-hover: color-mix(in srgb, var(--dp-on-surface) 8%, transparent);
		--dp-day-outside-bg: color-mix(in srgb, var(--dp-on-surface) 6%, transparent);
		--dp-primary: var(--mdc-theme-primary, #ff6a00);
		--dp-on-primary: var(--mdc-theme-on-primary, #fff);
		--dp-sidebar-bg: #111;
		--dp-sidebar-fg: #fff;
		--dp-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
		--dp-error: var(--mdc-theme-error, #b00020);

		position: relative;
		display: block;
		width: 100%;
		font-family: Roboto, system-ui, sans-serif;
		color: var(--dp-on-surface);
	}

	@media (prefers-color-scheme: dark) {
		.solas-datepicker {
			--dp-surface: var(--mdc-theme-surface, #212121);
			--dp-on-surface: var(--mdc-theme-on-surface, #fff);
			--dp-sidebar-bg: #0a0a0a;
			--dp-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
		}
	}

	.solas-datepicker__field {
		display: flex;
		align-items: stretch;
		width: 100%;
		min-width: 0;
	}

	.solas-datepicker__input {
		box-sizing: border-box;
		flex: 1 1 auto;
		min-width: 0;
		min-height: 3.25rem;
		padding: 0.75rem 0.85rem;
		border: 1px solid var(--dp-border);
		border-right: none;
		border-radius: 3px 0 0 3px;
		background: var(--dp-surface);
		color: var(--dp-on-surface);
		font: inherit;
		font-size: 0.95rem;
	}

	.solas-datepicker__input--error {
		border-color: var(--dp-error);
	}

	.solas-datepicker__input:focus {
		outline: none;
		border-color: var(--dp-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--dp-primary) 35%, transparent);
		z-index: 1;
	}

	.solas-datepicker__calendar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 3.25rem;
		min-height: 3.25rem;
		padding: 0;
		border: 1px solid var(--dp-border);
		border-radius: 0 3px 3px 0;
		background: var(--dp-surface);
		color: var(--dp-muted);
		cursor: pointer;
	}

	.solas-datepicker__calendar-btn:hover,
	.solas-datepicker__calendar-btn[aria-expanded='true'] {
		color: var(--dp-on-surface);
		background: var(--dp-day-hover);
	}

	.solas-datepicker__error {
		margin: 0.35rem 0 0;
		font-size: 0.8rem;
		color: var(--dp-error);
	}

	.solas-datepicker__popup {
		position: absolute;
		z-index: 40;
		top: calc(100% + 6px);
		left: 0;
		display: grid;
		grid-template-columns: minmax(22rem, 1fr) 9rem;
		width: min(40rem, calc(100vw - 1.5rem));
		background: var(--dp-surface);
		color: var(--dp-on-surface);
		border: 1px solid var(--dp-border);
		border-radius: 2px;
		box-shadow: var(--dp-shadow);
		overflow: hidden;
	}

	.solas-datepicker__calendar {
		padding: 0.75rem 0.85rem 1rem;
		background: var(--dp-surface);
	}

	.solas-datepicker__header {
		display: grid;
		grid-template-columns: 2.5rem 1fr 2.5rem;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.65rem;
	}

	.solas-datepicker__selectors {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		min-width: 0;
	}

	.solas-datepicker__select-wrap {
		min-width: 0;
	}

	.solas-datepicker__select {
		box-sizing: border-box;
		max-width: 100%;
		min-height: 2.25rem;
		padding: 0.25rem 0.45rem;
		border: 1px solid var(--dp-border);
		border-radius: 3px;
		background: var(--dp-surface);
		color: var(--dp-on-surface);
		font: inherit;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
	}

	.solas-datepicker__select--year {
		min-width: 4.75rem;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
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
		color: var(--dp-muted);
		cursor: pointer;
	}

	.solas-datepicker__nav:hover {
		background: var(--dp-day-hover);
		color: var(--dp-on-surface);
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
		color: var(--dp-muted);
	}

	.solas-datepicker__day {
		aspect-ratio: 1;
		min-height: 3.4rem;
		margin: 0;
		padding: 0;
		border: 1px solid var(--dp-border);
		margin-right: -1px;
		margin-bottom: -1px;
		background: var(--dp-surface);
		color: var(--dp-on-surface);
		font: inherit;
		font-size: 1.15rem;
		cursor: pointer;
	}

	.solas-datepicker__day:hover:not(:disabled):not(.solas-datepicker__day--selected) {
		background: var(--dp-day-hover);
	}

	.solas-datepicker__day--outside {
		color: var(--dp-muted);
		background: var(--dp-day-outside-bg);
	}

	.solas-datepicker__day--selected {
		background: var(--dp-primary);
		border-color: var(--dp-primary);
		color: var(--dp-on-primary);
		font-weight: 600;
		z-index: 1;
	}

	.solas-datepicker__day:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.solas-datepicker__sidebar {
		position: relative;
		background: var(--dp-sidebar-bg);
		color: var(--dp-sidebar-fg);
		padding: 1.25rem 0.85rem 1rem;
		min-height: 100%;
	}

	.solas-datepicker__sidebar-accent {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 0.45rem;
		background: var(--dp-primary);
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
