import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: [vitePreprocess()],
			adapter: adapter()
		})
	],
	ssr: {
		noExternal: ["@carbon/charts","@carbon/charts-svelte"]
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
