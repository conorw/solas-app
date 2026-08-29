import type { Locator } from '@playwright/test';

/**
 * Fill a native or SMUI text control using Playwright's fill(), which sets the
 * native value setter and dispatches input/change so Svelte bind:value updates.
 */
export async function fillTextField(field: Locator, value: string) {
	await field.waitFor({ state: 'visible' });
	const inner = field.locator('input, textarea');
	const target = (await inner.count()) > 0 ? inner.first() : field;
	await target.fill(value);
}

/** Set a checkbox by dispatching input/change so Svelte onchange handlers run. */
export async function setCheckbox(box: Locator, checked: boolean) {
	await box.waitFor({ state: 'visible' });
	await box.evaluate((node, value) => {
		const input =
			node instanceof HTMLInputElement
				? node
				: node.querySelector<HTMLInputElement>('input[type="checkbox"]');
		if (!(input instanceof HTMLInputElement)) {
			throw new Error('setCheckbox: no checkbox element found');
		}
		if (input.checked === value) return;
		input.checked = value;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
	}, checked);
}
