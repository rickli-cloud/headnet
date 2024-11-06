import { base } from '$app/paths';
import { loadSession } from '$lib/store/session';

export async function load({}) {
	if (!loadSession()) {
		window.location.href = base + '/auth';
		return;
	}

	return {};
}
