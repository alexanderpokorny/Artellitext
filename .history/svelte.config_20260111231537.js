import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			out: 'build',
			precompress: true,
			envPrefix: 'ARTELLICO_'
		}),
		alias: {
			$lib: './src/lib',
			$components: './src/lib/components',
			$stores: './src/lib/stores',
			$server: './src/lib/server',
			$types: './src/lib/types'
		},

		// CSP disabled - we use server-side headers in hooks.server.ts for production
		// SvelteKit's inline scripts for hydration conflict with strict CSP
		// csp: { ... }
	},
	compilerOptions: {
		runes: true
	}
};

export default config;
