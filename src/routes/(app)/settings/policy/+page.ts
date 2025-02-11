import { get } from 'svelte/store';

import { HeadscaleClient } from '$lib/store/session';
import { isTauri } from '$lib/utils/tauri';
import { Policy } from '$lib/api';

export async function load({ fetch }) {
	fetch = isTauri() ? (await import('@tauri-apps/plugin-http')).fetch : fetch;

	const policy = await Policy.load(get(HeadscaleClient), { fetch });

	return {
		policy: policy.data,
		errors: [policy.error].filter((i) => !!i)
	};
}
