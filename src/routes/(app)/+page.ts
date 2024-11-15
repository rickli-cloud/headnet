import { Acl, formatApiErrors, Headscale, Machine, Route, User } from '$lib/api/index.js';

export async function load({ data, fetch }) {
	const headscale = new Headscale({ fetch });

	const [machines, routes, users, acl] = await Promise.all([
		Machine.list(undefined, headscale),
		Route.list(headscale),
		User.list(headscale),
		Acl.load(headscale)
	]);

	return {
		...(data || {}),
		machines: machines.data,
		routes: routes.data,
		users: users.data,
		acl: acl.data,
		errors: formatApiErrors([machines.error, routes.error, users.error, acl.error])
	};
}
