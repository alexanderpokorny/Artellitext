import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Server configuration for development
	server: {
		port: 5173,
		strictPort: false,
		host: true,
		fs: {
			// Allow serving files from static folder (fonts)
			allow: ['..']
		},
		// Ignore source maps for problematic packages
		sourcemapIgnoreList: (sourcePath) => {
			return sourcePath.includes('node_modules/@editorjs');
		}
	},
	
	// Preview configuration
	preview: {
		port: 4173
	},
	
	// Resolve configuration
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
			$components: resolve('./src/lib/components'),
			$stores: resolve('./src/lib/stores'),
			$server: resolve('./src/lib/server'),
			$types: resolve('./src/lib/types')
		}
	},
	
	// Build optimization
	build: {
		target: 'ES2022',
		sourcemap: true,
		// Ignore source map warnings for problematic packages
		rollupOptions: {
			onwarn(warning, warn) {
				// Suppress source map warnings for EditorJS
				if (warning.code === 'SOURCEMAP_ERROR' && warning.message?.includes('@editorjs')) {
					return;
				}
				warn(warning);
			},
			output: {
				// Optimize font loading by keeping them as separate assets
				assetFileNames: (assetInfo) => {
					const name = assetInfo.name || '';
					if (/\.(woff2?|ttf|otf|eot)$/.test(name)) {
						return 'fonts/[name][extname]';
					}
					return 'assets/[name]-[hash][extname]';
				}
			}
		}
	},
	
	// CSS configuration
	css: {
		devSourcemap: true
	},
	
	// Optimize dependencies
	optimizeDeps: {
		include: ['katex'],
		exclude: ['@editorjs/editorjs']
	}
});
