import type { Page } from '@playwright/test';

/**
 * Navigate with retries for net::ERR_ABORTED, which happens when a concurrent
 * client navigation (e.g. PersonForm's history.back() after save) cancels goto.
 */
export async function gotoStable(page: Page, path: string, attempts = 3) {
	let lastError: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			return;
		} catch (err) {
			lastError = err;
			const msg = err instanceof Error ? err.message : String(err);
			if (!msg.includes('ERR_ABORTED') || i === attempts - 1) throw err;
			await page.waitForTimeout(300);
		}
	}
	throw lastError;
}
