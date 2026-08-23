import { defineConfig } from 'vitest/config';

/** Unit tests for pure TS modules — no SvelteKit plugin (avoids Vite 8 env API conflicts). */
export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
