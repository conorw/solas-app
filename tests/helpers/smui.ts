import type { Locator } from '@playwright/test';

/** Fill an SMUI Textfield (or native input) and sync Svelte state via input event. */
export async function fillTextField(field: Locator, value: string) {
	await field.click();
	await field.fill(value);
	await field.dispatchEvent('input', { bubbles: true });
}
