<script lang="ts">
	import type { PageData } from './$types';
	import type { person } from '#lib/types/rows.js';
	import Autocomplete from '@smui-extra/autocomplete';
	import Button, { Icon, Label } from '@smui/button';
	import Snackbar from '@smui/snackbar';
	import IconButton from '@smui/icon-button';
	import { Icon as CommonIcon } from '@smui/common';
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import { Text, PrimaryText, SecondaryText } from '@smui/list';
	import { getPersonDisplayName, getPersonMeta, getPersonName } from '#lib/person.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let primaryPerson: person | undefined = $state(undefined);
	let secondaryPerson: person | undefined = $state(undefined);
	let snackbar: Snackbar;
	let snackMessage = $state('');
	let mergeResult: {
		success?: boolean;
		recordsUpdated?: number;
		primaryPersonName?: string;
		secondaryPersonName?: string;
	} | null = $state(null);
	let confirmDialogOpen = $state(false);
	let merging = $state(false);

	const canMerge = $derived(
		!!primaryPerson &&
			!!secondaryPerson &&
			primaryPerson['Auto ID'] !== secondaryPerson['Auto ID']
	);

	async function searchItems(
		input: string,
		selectedPerson: person | undefined,
		excludePerson: person | undefined = undefined
	) {
		if (selectedPerson != null) {
			return [selectedPerson];
		}
		const people = data.people ?? [];
		const filtered = people.filter((item) => {
			if (excludePerson && item['Auto ID'] === excludePerson['Auto ID']) {
				return false;
			}
			if (!input) return true;
			return getPersonName(item).toLocaleLowerCase().includes(input.toLowerCase());
		});
		return input ? filtered : filtered.slice(0, 40);
	}

	function showSnack(message: string) {
		snackMessage = message;
		snackbar?.open();
	}

	function openConfirmDialog() {
		if (canMerge) {
			confirmDialogOpen = true;
		}
	}

	async function confirmMerge() {
		confirmDialogOpen = false;

		if (!primaryPerson || !secondaryPerson) {
			showSnack('Please select both persons');
			return;
		}

		merging = true;
		try {
			const formData = new FormData();
			formData.append('primaryPersonId', primaryPerson['Auto ID'].toString());
			formData.append('secondaryPersonId', secondaryPerson['Auto ID'].toString());

			const response = await fetch('?/merge', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			let payload = result.data;
			if (typeof payload === 'string') {
				try {
					const parsed = JSON.parse(payload);
					payload = Array.isArray(parsed) ? parsed[0] : parsed;
				} catch {
					payload = null;
				}
			}

			if (
				result.type === 'success' &&
				(payload?.success === true ||
					payload?.success === 1 ||
					payload?.recordsUpdated !== undefined)
			) {
				const primaryPersonName = getPersonDisplayName(primaryPerson);
				const secondaryPersonName =
					getPersonDisplayName(secondaryPerson) ||
					payload.secondaryPersonName ||
					'the merged person';

				mergeResult = {
					...payload,
					success: true,
					primaryPersonName,
					secondaryPersonName
				};
				showSnack(
					`Merged attendance from ${secondaryPersonName} into ${primaryPersonName}.`
				);
				primaryPerson = undefined;
				secondaryPerson = undefined;
			} else {
				showSnack(payload?.error || 'An error occurred during merge');
			}
		} catch (error) {
			showSnack(
				'An error occurred during merge: ' +
					(error instanceof Error ? error.message : 'Unknown error')
			);
		} finally {
			merging = false;
		}
	}
</script>

<div class="merge-page">
	<header class="merge-header">
		<h1>Merge people</h1>
		<p>
			Transfer all attendance from a duplicate person into the person you want to keep, then
			delete the duplicate from the people list.
		</p>
	</header>

	{#if mergeResult?.success}
		<div class="success-panel" role="status">
			<p class="success-panel__title">Merge successful</p>
			<p>
				<strong>{mergeResult.recordsUpdated || 0}</strong> attendance record(s) moved from
				<strong> {mergeResult.secondaryPersonName}</strong> into
				<strong> {mergeResult.primaryPersonName}</strong>.
			</p>
			<p>
				You can now delete <strong>{mergeResult.secondaryPersonName}</strong> from the people
				list.
			</p>
			<Button href="/people" variant="unelevated" class="success-btn">
				<Label>Go to people list</Label>
			</Button>
		</div>
	{/if}

	<section class="merge-panel">
		<div class="person-pickers">
			<div class="person-card">
				<h2>Keep (merge into)</h2>
				<p class="person-card__hint">The person who will remain.</p>
				<div class="field-row">
					<Autocomplete
						class="field-grow"
						search={(input) => searchItems(input, primaryPerson)}
						showMenuWithNoInput={true}
						getOptionLabel={(p) => getPersonDisplayName(p)}
						bind:value={primaryPerson}
						label="Primary person"
					>
						{#snippet match(p)}
							<Text>
								<PrimaryText>{getPersonDisplayName(p)}</PrimaryText>
								<SecondaryText>{getPersonMeta(p)}</SecondaryText>
							</Text>
						{/snippet}
					</Autocomplete>
					<IconButton
						onclick={() => (primaryPerson = undefined)}
						aria-label="Clear primary person"
					>
						<CommonIcon class="material-icons">clear</CommonIcon>
					</IconButton>
				</div>
				{#if primaryPerson}
					<p class="selected">
						Selected: <strong>{getPersonDisplayName(primaryPerson)}</strong>
						<span class="selected__meta">{getPersonMeta(primaryPerson)}</span>
					</p>
				{/if}
			</div>

			<div class="merge-arrow" aria-hidden="true">
				<span class="material-icons merge-arrow__icon">arrow_forward</span>
			</div>

			<div class="person-card">
				<h2>Duplicate (merge from)</h2>
				<p class="person-card__hint">Attendance moves away from this person.</p>
				<div class="field-row">
					<Autocomplete
						class="field-grow"
						search={(input) => searchItems(input, secondaryPerson, primaryPerson)}
						showMenuWithNoInput={true}
						getOptionLabel={(p) => getPersonDisplayName(p)}
						bind:value={secondaryPerson}
						label="Secondary person"
					>
						{#snippet match(p)}
							<Text>
								<PrimaryText>{getPersonDisplayName(p)}</PrimaryText>
								<SecondaryText>{getPersonMeta(p)}</SecondaryText>
							</Text>
						{/snippet}
					</Autocomplete>
					<IconButton
						onclick={() => (secondaryPerson = undefined)}
						aria-label="Clear secondary person"
					>
						<CommonIcon class="material-icons">clear</CommonIcon>
					</IconButton>
				</div>
				{#if secondaryPerson}
					<p class="selected">
						Selected: <strong>{getPersonDisplayName(secondaryPerson)}</strong>
						<span class="selected__meta">{getPersonMeta(secondaryPerson)}</span>
					</p>
				{/if}
			</div>
		</div>

		<div class="merge-actions">
			<Button
				type="button"
				variant="raised"
				class="merge-btn"
				disabled={!canMerge || merging}
				onclick={openConfirmDialog}
			>
				<Icon class="material-icons">merge_type</Icon>
				<Label>{merging ? 'Merging…' : 'Merge people'}</Label>
			</Button>
		</div>
	</section>
</div>

<Snackbar bind:this={snackbar}>
	<Label>{snackMessage}</Label>
</Snackbar>

<Dialog
	bind:open={confirmDialogOpen}
	aria-labelledby="merge-confirm-title"
	aria-describedby="merge-confirm-content"
>
	<Title id="merge-confirm-title">Confirm merge</Title>
	<Content id="merge-confirm-content">
		<div class="confirm-body">
			<p class="confirm-warning">This cannot be undone.</p>
			<ul class="confirm-list">
				<li>
					<strong>From:</strong>
					{getPersonDisplayName(secondaryPerson)}
					<span class="id-hint">(ID {secondaryPerson?.['Auto ID']})</span>
				</li>
				<li>
					<strong>Into:</strong>
					{getPersonDisplayName(primaryPerson)}
					<span class="id-hint">(ID {primaryPerson?.['Auto ID']})</span>
				</li>
			</ul>
			<p>All attendance for the duplicate will move to the person you keep. The duplicate stays in the system with no attendance until you delete them.</p>
		</div>
	</Content>
	<Actions>
		<Button onclick={() => (confirmDialogOpen = false)}>
			<Label>Cancel</Label>
		</Button>
		<Button onclick={confirmMerge} action="accept" variant="raised">
			<Icon class="material-icons">merge_type</Icon>
			<Label>Confirm merge</Label>
		</Button>
	</Actions>
</Dialog>

<style lang="scss">
	.merge-page {
		display: flex;
		flex-direction: column;
		gap: 1.15rem;
		padding: 1rem 1.25rem 2rem;
		max-width: 56rem;
		margin: 0 auto;
	}

	.merge-header {
		h1 {
			margin: 0 0 0.35rem;
			font-size: 1.5rem;
		}

		p {
			margin: 0;
			opacity: 0.75;
			line-height: 1.45;
			max-width: 40rem;
		}
	}

	.merge-panel {
		padding: 1.1rem;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		border-radius: 8px;
		background: var(--mdc-theme-surface, transparent);
	}

	.person-pickers {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		align-items: start;
	}

	@media (max-width: 840px) {
		.person-pickers {
			grid-template-columns: 1fr;
		}

		.merge-arrow {
			transform: rotate(90deg);
			justify-self: center;
		}
	}

	.person-card {
		min-width: 0;
		padding: 0.85rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, currentColor 12%, transparent);

		h2 {
			margin: 0 0 0.25rem;
			font-size: 1.05rem;
		}
	}

	.person-card__hint {
		margin: 0 0 0.75rem;
		font-size: 0.9rem;
		opacity: 0.7;
	}

	.field-row {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
	}

	:global(.field-grow) {
		flex: 1;
		min-width: 0;
	}

	:global(.field-grow .mdc-text-field) {
		width: 100%;
	}

	.selected {
		margin: 0.65rem 0 0;
		font-size: 0.95rem;
	}

	.selected__meta {
		display: block;
		margin-top: 0.15rem;
		opacity: 0.65;
		font-size: 0.85rem;
	}

	.merge-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-top: 2.5rem;
		opacity: 0.55;

		.material-icons {
			font-size: 1.75rem;
		}
	}

	.merge-actions {
		margin-top: 1.15rem;
		display: flex;
		justify-content: flex-end;
	}

	:global(.merge-btn) {
		min-height: 3rem;
		min-width: 12rem;
	}

	.success-panel {
		padding: 1.1rem 1.2rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, #4caf50 55%, transparent);
		background: color-mix(in srgb, #4caf50 16%, transparent);

		p {
			margin: 0 0 0.55rem;
			line-height: 1.4;
		}
	}

	.success-panel__title {
		font-size: 1.1rem;
		font-weight: 600;
	}

	:global(.success-btn) {
		margin-top: 0.5rem;
		min-height: 2.75rem;
	}

	.confirm-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: min(22rem, 70vw);
	}

	.confirm-warning {
		margin: 0;
		font-weight: 600;
		color: var(--mdc-theme-error, #b00020);
	}

	.confirm-list {
		margin: 0;
		padding-left: 1.2rem;

		li {
			margin-bottom: 0.35rem;
		}
	}

	.id-hint {
		opacity: 0.65;
		font-size: 0.9rem;
	}

	@media (prefers-color-scheme: dark) {
		.merge-panel,
		.person-card {
			background: var(--mdc-theme-surface, #212121);
		}

		.success-panel {
			background: color-mix(in srgb, #4caf50 22%, #121212);
			border-color: color-mix(in srgb, #81c784 45%, transparent);
		}
	}
</style>
