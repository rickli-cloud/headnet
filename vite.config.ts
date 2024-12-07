import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import { stringify } from 'yaml';
import { config } from 'dotenv';

import pkg from './package.json';

config();
const {
	HEADSCALE_HOST = 'http://localhost:8080',
	PUBLIC_MOCK_ENABLED,
	BASE_PATH = '/admin',
	BUILD_TARGET = 'node',
	HMR_ENABLED = 'true'
} = process.env;

export default defineConfig(({ mode }) => {
	const server: ViteUserConfig['server'] = {
		cors: { origin: '*', methods: '*', allowedHeaders: '*', preflightContinue: true },
		hmr: HMR_ENABLED === 'true'
	};

	if (HMR_ENABLED !== 'true') {
		console.warn('[HMR] disabled');
	}

	if (mode === 'production') {
		console.debug(
			`[build]:\n${stringify({ target: BUILD_TARGET, base: BASE_PATH, mock: PUBLIC_MOCK_ENABLED === 'true' })}`
		);
	}

	if (mode === 'development') {
		if (PUBLIC_MOCK_ENABLED === 'true') {
			console.debug(`[Mock] ^/api`);
		} else if (typeof HEADSCALE_HOST === 'string') {
			console.debug(`[Proxy] ^/api => ${HEADSCALE_HOST}`);
			server.proxy = {
				'^/api': {
					target: HEADSCALE_HOST,
					changeOrigin: true,
					secure: false
				}
			};
		}
	}

	return {
		server,
		__APP_VERSION__: pkg.version,
		plugins: [sveltekit()],
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		}
	};
});
