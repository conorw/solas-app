<script lang="ts">
	import type { PageData } from './$types';
	import type { person } from '$lib/types/rows';
	import Autocomplete from '@smui-extra/autocomplete';
	import Button, { Icon, Label } from '@smui/button';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Snackbar from '@smui/snackbar';
	import IconButton from '@smui/icon-button';
	import Dialog, { Title, Content, Actions } from '@smui/dialog';
	import { DateTime } from 'luxon';
	import { enhance } from '$app/forms';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let primaryPerson: person | undefined = $state(undefined);
	let secondaryPerson: person | undefined = $state(undefined);
	let snackbar: Snackbar;
	let snackMessage = $state('');
	let snackType: 'success' | 'error' = $state('success');
	let mergeResult: any = $state(null);
	let confirmDialogOpen = $state(false);
	let mergeForm: HTMLFormElement;

	function capitalizeFirstLetter(str: string) {
		return str?.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	function getPersonName(person: any) {
		if (!person) return '';
		return person
			? `${capitalizeFirstLetter(person.FirstName)} ${
					capitalizeFirstLetter(person.LastName) || ''
			  } (b.${person.DateOfBirth ? DateTime.fromISO(person.DateOfBirth).toFormat('yyyy') : 'N/A'})`
			: '';
	}

	async function searchItems(
		input: string,
		selectedPerson: person | undefined,
		excludePerson: person | undefined = undefined
	) {
		if (!input || input.length < 2) {
			return [];
		}
		if (selectedPerson != null) {
			return [selectedPerson];
		}
		const search = input.toLowerCase();
		return (
			data.people?.filter((item) => {
				// Exclude the specified person (e.g., primary person from secondary list)
				if (excludePerson && item['Auto ID'] === excludePerson['Auto ID']) {
					return false;
				}
				return getPersonName(item).toLocaleLowerCase().includes(search);
			}) || []
		);
	}

	const handleMerge = async ({ result, update }: any) => {
		// Debug logging
		console.log('Merge result:', result);
		console.log('Result type:', result?.type);
		console.log('Result data:', result?.data);
		console.log('Update function:', update);

		if (!result) {
			console.error('No result received');
			snackMessage = 'No response from server';
			snackType = 'error';
			snackbar?.open();
			if (update && typeof update === 'function') {
				await update({ reset: false });
			}
			return;
		}

		// Check if the action was successful
		if (result.type === 'success') {
			const data = result.data;
			console.log('Processing success, data:', data);
			
			// Check if our action returned success or has the expected fields
			if (data?.success === true || (data?.recordsUpdated !== undefined || data?.secondaryPersonName)) {
				// Merge was successful
				const recordsCount = data.recordsUpdated || 0;
				const personName = data.secondaryPersonName || 'the merged person';
				
				// Set mergeResult FIRST so the success box appears immediately
				mergeResult = { ...data, success: true };
				snackMessage = `Successfully merged ${recordsCount} attendance record(s). You can now delete ${personName}.`;
				snackType = 'success';
				
				// Clear selections after successful merge
				primaryPerson = undefined;
				secondaryPerson = undefined;
				
				// Update first, then show snackbar
				if (update && typeof update === 'function') {
					await update({ reset: false });
				}
				
				// Show snackbar after state update
				setTimeout(() => {
					console.log('Opening snackbar with message:', snackMessage);
					console.log('Snackbar instance:', snackbar);
					if (snackbar) {
						snackbar.open();
					} else {
						console.error('Snackbar not initialized');
					}
				}, 300);
			} else if (data?.error) {
				// Error response from our action
				snackMessage = data.error;
				snackType = 'error';
				if (update && typeof update === 'function') {
					await update({ reset: false });
				}
				setTimeout(() => snackbar?.open(), 200);
			} else {
				// Unexpected success response
				console.warn('Unexpected response format:', data);
				snackMessage = 'Merge completed, but response format was unexpected. Check console for details.';
				snackType = 'error';
				if (update && typeof update === 'function') {
					await update({ reset: false });
				}
				setTimeout(() => snackbar?.open(), 200);
			}
		} else {
			// Failure case
			console.error('Merge failed:', result);
			snackMessage = result.data?.error || 'An error occurred during merge';
			snackType = 'error';
			if (update && typeof update === 'function') {
				await update({ reset: false });
			}
			setTimeout(() => snackbar?.open(), 200);
		}
	};

	function openConfirmDialog() {
		if (primaryPerson && secondaryPerson && primaryPerson['Auto ID'] !== secondaryPerson['Auto ID']) {
			confirmDialogOpen = true;
		}
	}

	async function confirmMerge() {
		confirmDialogOpen = false;
		console.log('Confirm merge clicked');
		
		if (!primaryPerson || !secondaryPerson) {
			snackMessage = 'Please select both persons';
			snackType = 'error';
			snackbar?.open();
			return;
		}

		// Wait for dialog to close, then submit manually
		setTimeout(async () => {
			try {
				const formData = new FormData();
				formData.append('primaryPersonId', primaryPerson['Auto ID'].toString());
				formData.append('secondaryPersonId', secondaryPerson['Auto ID'].toString());

				console.log('Submitting merge request manually');
				const response = await fetch('?/merge', {
					method: 'POST',
					body: formData
				});

				const result = await response.json();
				console.log('Merge response:', result);

				// Parse the data if it's a string
				let data = result.data;
				if (typeof data === 'string') {
					try {
						const parsed = JSON.parse(data);
						// The parsed data might be an array, get the first element if so
						data = Array.isArray(parsed) ? parsed[0] : parsed;
					} catch (e) {
						console.error('Failed to parse response data:', e);
					}
				}

				if (result.type === 'success' && (data?.success === true || data?.success === 1 || data?.recordsUpdated !== undefined)) {
					// Merge was successful
					// Get person names before clearing selections
					const primaryPersonName = getPersonName(primaryPerson);
					const secondaryPersonName = getPersonName(secondaryPerson) || data.secondaryPersonName || 'the merged person';
					
					mergeResult = { 
						...data, 
						success: true,
						primaryPersonName: primaryPersonName,
						secondaryPersonName: secondaryPersonName
					};
					const recordsCount = data.recordsUpdated || 0;
					snackMessage = `Successfully merged attendance record(s) from ${secondaryPersonName} to ${primaryPersonName}. You can now delete ${secondaryPersonName}.`;
					snackType = 'success';
					
					// Clear selections
					primaryPerson = undefined;
					secondaryPerson = undefined;
					
					// Show snackbar
					setTimeout(() => snackbar?.open(), 100);
				} else {
					// Error case
					snackMessage = data?.error || 'An error occurred during merge';
					snackType = 'error';
					setTimeout(() => snackbar?.open(), 100);
				}
			} catch (error) {
				console.error('Merge error:', error);
				snackMessage = 'An error occurred during merge: ' + (error instanceof Error ? error.message : 'Unknown error');
				snackType = 'error';
				setTimeout(() => snackbar?.open(), 100);
			}
		}, 150);
	}
</script>

<LayoutGrid>
	<Cell span={12}>
		<h1>Merge Persons</h1>
		<p>Select a primary person (to merge INTO) and a secondary person (to merge FROM). All attendance records from the secondary person will be transferred to the primary person.</p>
	</Cell>

	<Cell span={12}>
		<form method="POST" action="?/merge" use:enhance={handleMerge} bind:this={mergeForm}>
			<LayoutGrid>
				<Cell span={6}>
					<h3>Primary Person (merge INTO)</h3>
					<Autocomplete
						style="width: 100%"
						search={(input) => searchItems(input, primaryPerson)}
						showMenuWithNoInput={false}
						getOptionLabel={(person) => getPersonName(person)}
						bind:value={primaryPerson}
						label="Start Typing Person Name"
					/>
					<IconButton
						class="material-icons"
						onclick={() => (primaryPerson = undefined)}
						aria-label="Clear primary person"
					>
						clear
					</IconButton>
					{#if primaryPerson}
						<p>Selected: {getPersonName(primaryPerson)}</p>
					{/if}
					<input type="hidden" name="primaryPersonId" value={primaryPerson?.['Auto ID'] || ''} />
				</Cell>

				<Cell span={6}>
					<h3>Secondary Person (merge FROM)</h3>
					<Autocomplete
						style="width: 100%"
						search={(input) => searchItems(input, secondaryPerson, primaryPerson)}
						showMenuWithNoInput={false}
						getOptionLabel={(person) => getPersonName(person)}
						bind:value={secondaryPerson}
						label="Start Typing Person Name"
					/>
					<IconButton
						class="material-icons"
						onclick={() => (secondaryPerson = undefined)}
						aria-label="Clear secondary person"
					>
						clear
					</IconButton>
					{#if secondaryPerson}
						<p>Selected: {getPersonName(secondaryPerson)}</p>
					{/if}
					<input type="hidden" name="secondaryPersonId" value={secondaryPerson?.['Auto ID'] || ''} />
				</Cell>

				<Cell span={12}>
					<Button
						type="button"
						variant="raised"
						disabled={!primaryPerson || !secondaryPerson || primaryPerson?.['Auto ID'] === secondaryPerson?.['Auto ID']}
						onclick={openConfirmDialog}
					>
						<Icon class="material-icons">merge_type</Icon>
						<Label>Merge Persons</Label>
					</Button>
				</Cell>

				{#if mergeResult?.success}
					<Cell span={12}>
						<div style="margin-top: 20px; padding: 20px; background-color: #e8f5e9; border-radius: 4px; border: 2px solid #4caf50;">
							<p style="margin: 0 0 10px 0; color: #2e7d32; font-size: 18px;">
								<strong>✓ Merge Successful!</strong>
							</p>
							<p style="margin: 0 0 10px 0; color: #2e7d32;">
								<strong>{mergeResult.recordsUpdated || 0}</strong> attendance record(s) have been merged from <strong>{mergeResult.secondaryPersonName || 'the secondary person'}</strong> into <strong>{mergeResult.primaryPersonName || 'the primary person'}</strong>.
							</p>
							<p style="margin: 10px 0; color: #2e7d32; font-weight: 500;">
								You can now delete <strong>{mergeResult.secondaryPersonName || 'the merged person'}</strong> from the people list.
							</p>
							<Button
								href="/people"
								variant="outlined"
								style="margin-top: 15px;"
							>
								<Label>Go to People List to Delete Merged Person</Label>
							</Button>
						</div>
					</Cell>
				{/if}
			</LayoutGrid>
		</form>
	</Cell>
</LayoutGrid>

<Snackbar bind:this={snackbar}>
	<Label>{snackMessage}</Label>
</Snackbar>

<Dialog bind:open={confirmDialogOpen} aria-labelledby="merge-confirm-title" aria-describedby="merge-confirm-content">
	<Title id="merge-confirm-title">Confirm Person Merge</Title>
	<Content id="merge-confirm-content">
		<div style="padding: 10px 0;">
			<p><strong>Warning: This action cannot be undone.</strong></p>
			<p>You are about to merge:</p>
			<ul style="margin: 15px 0; padding-left: 20px;">
				<li><strong>From:</strong> {getPersonName(secondaryPerson)} (ID: {secondaryPerson?.['Auto ID']})</li>
				<li><strong>Into:</strong> {getPersonName(primaryPerson)} (ID: {primaryPerson?.['Auto ID']})</li>
			</ul>
			<p style="margin-top: 15px;">
				<strong>What will happen:</strong>
			</p>
			<ul style="margin: 10px 0; padding-left: 20px;">
				<li>All attendance records for <strong>{getPersonName(secondaryPerson)}</strong> will be transferred to <strong>{getPersonName(primaryPerson)}</strong></li>
				<li>The attendance records will be updated with the primary person's ID and name</li>
				<li>The secondary person (<strong>{getPersonName(secondaryPerson)}</strong>) will remain in the system but will have no attendance records</li>
				<li>You will be able to delete the secondary person after the merge is complete</li>
			</ul>
			<p style="margin-top: 15px; color: #d32f2f;">
				<strong>Are you sure you want to proceed?</strong>
			</p>
		</div>
	</Content>
	<Actions>
		<Button onclick={() => (confirmDialogOpen = false)}>
			<Label>Cancel</Label>
		</Button>
		<Button onclick={confirmMerge} action="accept" variant="raised">
			<Icon class="material-icons">merge_type</Icon>
			<Label>Confirm Merge</Label>
		</Button>
	</Actions>
</Dialog>

<style>
	:global {
		.mdc-text-field {
			width: 100%;
		}
	}
</style>

