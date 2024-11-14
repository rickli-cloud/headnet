import { goto } from '$app/navigation';
import { base } from '$app/paths';

import { loadSession } from '$lib/store/session';

export async function load() {
	if (loadSession()) goto(base + '/');
}
