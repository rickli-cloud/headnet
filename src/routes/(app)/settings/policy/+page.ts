import { Acl, Headscale } from '$lib/api/headscale.js';
import { ApiError, formatApiErrors } from '$lib/api/index.js';

export async function load({ fetch }) {
	const headscale = new Headscale({ fetch });

	const acl = await Acl.load(headscale);

	return {
		acl: acl.data,
		errors: formatApiErrors(acl.error instanceof ApiError ? [acl.error] : [])
	};
}
