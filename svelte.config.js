import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapterStatic from '@sveltejs/adapter-static';
import adapterAuto from '@sveltejs/adapter-auto';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

import dotenv from 'dotenv';
dotenv.config();

const { BASE_PATH = '/admin', BUILD_TARGET = 'static' } = process.env;

// See https://kit.svelte.dev/docs/adapters for more information about adapters.
/** @returns import("svelte").Adapter */
function getAdapter() {
	switch (BUILD_TARGET) {
		case 'static':
			return adapterStatic({ fallback: 'index.html' });
		default:
			return adapterAuto();
	}
}

/** @type {typeof import("./package.json")}; */
const pkg = JSON.parse(
	readFileSync(fileURLToPath(new URL('package.json', import.meta.url)), 'utf8')
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess({}),

	kit: {
		adapter: getAdapter(),
		paths: {
			base: BASE_PATH === '/' ? undefined : BASE_PATH
			// assets: '/static'
		},
		version: {
			name: pkg.version
		}
	}
};

export default config;
