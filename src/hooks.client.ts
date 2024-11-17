import { worker } from '$lib/mock/browser';
import { env } from '$env/dynamic/public';
import { base } from '$app/paths';

if (env.PUBLIC_MOCK_ENABLED === 'true') {
	worker.start({
		onUnhandledRequest(request, print) {
			if (/^\/api/.test(request.url)) {
				print.warning();
			}
		},
		serviceWorker: {
			url: base + '/mockServiceWorker.js'
		}
	});
}

// TODO: handle error
