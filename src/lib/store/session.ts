import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { Headscale, type HeadscaleConstructorParameters } from '$lib/api';
import { isTauri } from '$lib/utils/tauri';
import { get, writable } from 'svelte/store';

let tauriFetch: typeof fetch = fetch;

if (isTauri()) {
	import('@tauri-apps/plugin-http').then(({ fetch }) => (tauriFetch = fetch));
}

enum StorageIdentifiers {
	base = 'headnet.',
	token = base + 'session.token',
	baseurl = base + 'session.baseUrl'
}

export interface SessionData {
	token?: string;
	baseUrl?: string;
}

export const Session = writable<SessionData | undefined>();

export const HeadscaleClient = writable<Headscale>();

// Session.subscribe((session) => console.debug({ session }));

export function loadSession(): boolean {
	const session: SessionData = {
		token: sessionStorage.getItem(StorageIdentifiers.token) || undefined,
		baseUrl: localStorage.getItem(StorageIdentifiers.baseurl) || undefined
	};

	Session.set(session);

	return !!session.token;
}

export function initSession(session: SessionData) {
	Session.set(session);
	if (session.token) sessionStorage.setItem(StorageIdentifiers.token, session.token);
	if (session.baseUrl) localStorage.setItem(StorageIdentifiers.baseurl, session.baseUrl);
}

export function endSession() {
	Session.set(undefined);
	sessionStorage.removeItem(StorageIdentifiers.token);
	localStorage.removeItem(StorageIdentifiers.baseurl);
}

/** Create headscale client with middlewares  */
export function createHeadscaleClient(opt?: HeadscaleConstructorParameters): Headscale {
	const hs = new Headscale({
		fetch: tauriFetch,
		...opt
	});

	hs.client.use({
		async onRequest({ request }) {
			const session = get(Session);
			request.destination;
			if (session?.token) {
				request.headers.set('Authorization', 'Bearer ' + session.token);
			}
			return request;
		},
		async onResponse({ response }) {
			if (response.status > 299) {
				const res = response.clone();
				const reader = res.body?.getReader();
				const rawBody = await reader?.read();
				const body = rawBody?.value ? new TextDecoder().decode(rawBody.value) : undefined;
				reader?.releaseLock();

				if (res.status === 500 && body === 'Unauthorized') {
					endSession();
					goto(base + '/auth');
					return;
				}
			}
		}
	});

	return hs;
}
