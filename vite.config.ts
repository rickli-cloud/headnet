import { defineConfig, type ViteUserConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { stringify } from 'yaml';
import { config } from 'dotenv';

import pkg from './package.json';

config();
const {
	HEADSCALE_HOST = 'http://localhost:8080',
	PUBLIC_MOCK_ENABLED,
	BASE_PATH = '/admin',
	BUILD_TARGET = 'node',
	HMR_ENABLED = 'true',
	TAURI_ENV_PLATFORM,
	TAURI_ENV_ARCH,
	TAURI_ENV_DEBUG
} = process.env;

export default defineConfig(({ mode }) => {
	const server: ViteUserConfig['server'] = {
		cors: { origin: '*', methods: '*', allowedHeaders: '*', preflightContinue: true },
		hmr: HMR_ENABLED === 'true'
	};

	if (HMR_ENABLED !== 'true') {
		console.warn('[HMR]: disabled');
	}

	if (mode === 'production') {
		console.debug(
			`[build]:\n${stringify({ target: BUILD_TARGET, base: BASE_PATH, mock: PUBLIC_MOCK_ENABLED === 'true', tauri: TAURI_ENV_PLATFORM !== undefined })}`
		);
	}

	if (typeof TAURI_ENV_PLATFORM !== 'undefined') {
		console.debug(
			`[tauri]:\n${stringify({ arch: TAURI_ENV_ARCH, platform: TAURI_ENV_PLATFORM, debug: TAURI_ENV_DEBUG === 'true' })}`
		);
	}

	if (mode === 'development') {
		if (PUBLIC_MOCK_ENABLED === 'true') {
			console.debug(`[Mock]: ^/api`);
		} else if (typeof HEADSCALE_HOST === 'string') {
			console.debug(`[Proxy]: ^/api => ${HEADSCALE_HOST}`);
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
		},
		define: {
			__TAURI__: typeof TAURI_ENV_PLATFORM !== 'undefined'
		}
	};
});
