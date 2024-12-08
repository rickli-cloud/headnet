import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapterNode from '@sveltejs/adapter-node';
import adapterAuto from '@sveltejs/adapter-auto';
import adapterStatic from '@sveltejs/adapter-static';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

import dotenv from 'dotenv';
dotenv.config();

const { BASE_PATH = '/admin', BUILD_TARGET = 'node' } = process.env;

// See https://kit.svelte.dev/docs/adapters for more information about adapters.
const adapter =
	BUILD_TARGET === 'node'
		? adapterNode()
		: BUILD_TARGET === 'static'
			? adapterStatic({ fallback: 'index.html' })
			: adapterAuto();

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
		adapter,
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
