import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}, kit: {
		target: "#svelte",
		vite: {
			ssr: {
				noExternal: ['dayjs', '@carbon/charts', 'carbon-components']
			}
		}
	}

};

export default config;
