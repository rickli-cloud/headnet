import { Acl, ApiError, formatApiErrors, Headscale, Machine, Route, User } from '$lib/api/index.js';
import { stringify } from 'yaml';

export async function load({ data, fetch }) {
	const headscale = new Headscale({ fetch });

	const [machines, routes, users, acl] = await Promise.all([
		Machine.list(undefined, headscale),
		Route.list(headscale),
		User.list(headscale),
		Acl.load(headscale)
	]);

	console.debug(acl.data.stringify());
	console.debug(stringify(acl.data.acls));

	return {
		...(data || {}),
		acl: acl.data,
		users: users.data,
		routes: routes.data,
		machines: machines.data,
		errors: (
			formatApiErrors([
				machines.error,
				routes.error,
				users.error,
				acl.error instanceof ApiError ? acl.error : undefined
			]) as unknown[]
		).concat(
			acl.error !== null && typeof acl.error !== 'undefined' && !(acl.error instanceof ApiError)
				? [acl.error]
				: []
		)
	};
}
