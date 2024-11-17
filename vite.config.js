import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(),wasm(), topLevelAwait()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}, kit: {
		target: "#svelte",
		vite: {
			ssr: {
				noExternal: ['dayjs', '@carbon/charts', 'carbon-components']
			}
		}
	},
	  optimizeDeps: {
		esbuildOptions: {
			target: 'esnext'
		  },
		// Don't optimize these packages as they contain web workers and WASM files.
		// https://github.com/vitejs/vite/issues/11672#issuecomment-1415820673
		exclude: ['@journeyapps/wa-sqlite', '@powersync/web'],
		include: ['@powersync/web > js-logger'] 
	  },
	  build: {
		target: 'esnext'
	  },
	  worker: {
		format: 'es',
		plugins: () => [wasm(), topLevelAwait()]
	  }
};

export default config;
