import { Acl, formatApiErrors, Headscale, Machine, Route, User } from '$lib/api/index.js';

export async function load({ data, fetch }) {
	const headscale = new Headscale({ fetch });

	const machines = await Machine.list(undefined, headscale);
	const routes = await Route.list(headscale);
	const users = await User.list(headscale);
	const acl = await Acl.load(headscale);

	return {
		...(data || {}),
		machines: machines.data,
		routes: routes.data,
		users: users.data,
		acl: acl.data,
		errors: formatApiErrors([machines.error, routes.error, users.error, acl.error])
	};
}
