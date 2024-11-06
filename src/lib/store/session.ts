import { writable } from 'svelte/store';

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

Session.subscribe((session) => console.warn({ session }));

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
