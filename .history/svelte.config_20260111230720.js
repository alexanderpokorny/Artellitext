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

		csp: {
			directives: {
				'script-src': ['self', 'sha256-fTugEYRrERj0ywbCGl30fmWkRukAuR9bW6qB9b2sr3M='],
				'style-src': ['self', 'unsafe-inline']
			}
		}
	},
	compilerOptions: {
		runes: true
	}
};

export default config;
