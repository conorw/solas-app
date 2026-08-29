import type { Locator } from '@playwright/test';

/** Fill an SMUI Textfield (or native input) and sync Svelte state via input events. */
export async function fillTextField(field: Locator, value: string) {
	await field.waitFor({ state: 'visible' });
	await field.evaluate((node, val) => {
		const setValue = (input: HTMLInputElement | HTMLTextAreaElement) => {
			input.focus();
			input.select();
			input.value = val;
			input.dispatchEvent(
				new InputEvent('input', { bubbles: true, inputType: 'insertText', data: val })
			);
			input.dispatchEvent(new Event('change', { bubbles: true }));
		};

		if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
			setValue(node);
			return;
		}
		const input = node.querySelector('input, textarea');
		if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
			setValue(input);
			return;
		}
		throw new Error('fillTextField: no input element found');
	}, value);
}
