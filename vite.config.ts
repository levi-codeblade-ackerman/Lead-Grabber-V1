import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['lucide-svelte']
	},
	build: {
		minify: true,
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					'vendor': ['svelte', '@sveltejs/kit'],
					'ui': ['lucide-svelte', 'svelte-sonner', 'bits-ui'],
				}
			}
		}
	},
	optimizeDeps: {
		include: ['lucide-svelte', 'svelte-sonner', 'bits-ui']
	}
});
