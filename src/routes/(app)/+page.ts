import { createHeadscaleClient, HeadscaleClient, Session } from '$lib/store/session.js';
import { isTauri } from '$lib/utils/tauri.js';
import { get } from 'svelte/store';

export async function load({ data, fetch }) {
	const headscale = createHeadscaleClient({ baseUrl: get(Session)?.baseUrl });
	HeadscaleClient.set(headscale);

	fetch = isTauri() ? (await import('@tauri-apps/plugin-http')).fetch : fetch;

	const [machines, routes, users, policy] = await Promise.all([
		headscale.Node.list(headscale, { fetch }),
		headscale.Route.list(headscale, { fetch }),
		headscale.User.list(headscale, { fetch }),
		headscale.Policy.load(headscale, { fetch })
	]);

	return {
		...(data || {}),
		policy: policy.data,
		users: users.data,
		routes: routes.data,
		machines: machines.data,
		errors: [machines.error, routes.error, users.error, policy.error].filter((e) => !!e)
	};
}
