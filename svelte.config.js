import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

import dotenv from 'dotenv';
dotenv.config();

const { BASE_PATH = '/admin' } = process.env;

/** @type {typeof import("./package.json")}; */
const pkg = JSON.parse(
	readFileSync(fileURLToPath(new URL('package.json', import.meta.url)), 'utf8')
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		paths: {
			base: BASE_PATH
			// assets: '/static'
		},
		version: {
			name: pkg.version
		}
	}
};

export default config;
