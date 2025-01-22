import { faker } from '@faker-js/faker';

import { type V1ApiKey, type V1User } from '$lib/api';

import { handler, randomString } from './utils';
import { createDatabase } from './store';

faker.seed();

let database: IDBDatabase;

createDatabase().then((db) => (database = db));

export const handlers: ReturnType<typeof handler>[] = [
	// Users
	handler({
		path: '/api/v1/user',
		method: 'get',
		response: function () {
			return new Promise((resolve, reject) => {
				try {
					const store = database.transaction('users', 'readonly').objectStore('users');
					const query = store.getAll();

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ users: query.result });
				} catch (err) {
					reject(err);
				}
			});
		}
	}),
	handler({
		path: '/api/v1/user',
		method: 'post',
		response: function ({ request }) {
			return new Promise(async (resolve, reject) => {
				try {
					const body = await request.json();
					const user: V1User = {
						name: body.name,
						displayName: body.name,
						createdAt: new Date(Date.now()).toISOString()
					};

					const store = database.transaction('users', 'readwrite').objectStore('users');
					const query = store.add(user);

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ user });
				} catch (err) {
					reject(err);
				}
			});
		}
	}),
	handler({
		path: '/api/v1/user/:name' as '/api/v1/user/{name}',
		method: 'delete',
		response: function ({ params }) {
			return new Promise(async (resolve, reject) => {
				try {
					const store = database.transaction('users', 'readwrite').objectStore('users');
					const query = store.delete(String(params.name));

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({});
				} catch (err) {
					reject(err);
				}
			});
		}
	}),

	// API keys
	handler({
		path: '/api/v1/apikey',
		method: 'get',
		response: function () {
			return new Promise((resolve, reject) => {
				try {
					const store = database.transaction('apikeys', 'readonly').objectStore('apikeys');
					const query = store.getAll();

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ apiKeys: query.result });
				} catch (err) {
					reject(err);
				}
			});
		}
	}),
	handler({
		path: '/api/v1/apikey',
		method: 'post',
		response: function ({ request }) {
			return new Promise(async (resolve, reject) => {
				try {
					const body = await request.json();
					const key = btoa(window.crypto.getRandomValues(new Uint8Array(8)).toString()).replace(
						/=+$/,
						''
					);
					const apiKey: V1ApiKey = {
						id: String(faker.number.octal()),
						expiration: body.expiration,
						createdAt: new Date(Date.now()).toISOString(),
						prefix: key.slice(0, 4)
					};

					const store = database.transaction('apikeys', 'readwrite').objectStore('apikeys');
					const query = store.add(apiKey);

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ apiKey: key });
				} catch (err) {
					reject(err);
				}
			});
		}
	}),
	handler({
		path: '/api/v1/apikey/expire',
		method: 'post',
		response: function ({ request }) {
			return new Promise(async (resolve, reject) => {
				try {
					const body = await request.json();
					if (!body.prefix) return reject('Prefix is required!');

					const store = database.transaction('apikeys', 'readwrite').objectStore('apikeys');
					const query = store.get(body.prefix);

					query.onerror = () => reject(query.error);
					query.onsuccess = async () => {
						if (!query.result) reject('ApiKey not found');
						if (new Date(query.result.expiration).getTime() < Date.now())
							reject('ApiKey already expired');

						const putQuery = store.put(
							{ ...query.result, expiration: new Date(Date.now()).toISOString() } as V1ApiKey,
							body.prefix
						);

						putQuery.onerror = () => reject(query.error);
						putQuery.onsuccess = () => resolve({});
					};
				} catch (err) {
					reject(err);
				}
			});
		}
	}),
	handler({
		path: '/api/v1/apikey/:prefix' as '/api/v1/apikey/{prefix}',
		method: 'delete',
		response: function ({ params }) {
			return new Promise(async (resolve, reject) => {
				try {
					const store = database.transaction('apikeys', 'readwrite').objectStore('apikeys');
					const query = store.delete(String(params.prefix));

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({});
				} catch (err) {
					reject(err);
				}
			});
		}
	}),

	// Nodes
	handler({
		path: '/api/v1/node',
		method: 'get',
		response: function () {
			return new Promise((resolve, reject) => {
				try {
					const store = database.transaction('machines', 'readwrite').objectStore('machines');
					const query = store.getAll();

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ nodes: query.result });
				} catch (err) {
					reject(err);
				}
			});
		}
	}),
	handler({
		path: '/api/v1/node/backfillips',
		method: 'post',
		response: {
			changes: []
		}
	}),
	handler({
		path: '/api/v1/node/register',
		method: 'post',
		response: {}
	}),
	handler({
		path: '/api/v1/node/:nodeId/expire' as '/api/v1/node/{nodeId}/expire',
		method: 'post',
		response: {
			node: {}
		}
	}),
	handler({
		path: '/api/v1/node/:nodeId/rename/:newName' as '/api/v1/node/{nodeId}/rename/{newName}',
		method: 'post',
		response: {
			node: {}
		}
	}),
	handler({
		path: '/api/v1/node/:nodeId/routes' as '/api/v1/node/{nodeId}/routes',
		method: 'get',
		response: {
			routes: []
		}
	}),
	handler({
		path: '/api/v1/node/:nodeId/tags' as '/api/v1/node/{nodeId}/tags',
		method: 'post',
		response: {
			node: {}
		}
	}),
	handler({
		path: '/api/v1/node/:nodeId/user' as '/api/v1/node/{nodeId}/user',
		method: 'post',
		response: {
			node: {}
		}
	}),
	handler({
		path: '/api/v1/node/:nodeId' as '/api/v1/node/{nodeId}',
		method: 'delete',
		response: {}
	}),

	// Policy
	handler({
		path: '/api/v1/policy',
		method: 'get',
		response: function () {
			return new Promise((resolve, reject) => {
				try {
					const store = database.transaction('policy', 'readonly').objectStore('policy');
					const query = store.getAll();

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ ...query.result[0] });
				} catch (err) {
					reject(err);
				}
			});
		}
	}),
	handler({
		path: '/api/v1/policy',
		method: 'put',
		response: function ({ request }) {
			return new Promise(async (resolve, reject) => {
				try {
					const body = await request.json();
					if (!body.policy) return reject('Policy is required!');

					const store = database.transaction('policy', 'readwrite').objectStore('policy');
					const query = store.put({
						policy: body.policy,
						updatedAt: new Date(Date.now()).toISOString(),
						id: 1
					});

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ policy: body.policy });
				} catch (err) {
					reject(err);
				}
			});
		}
	}),

	// Pre auth keys
	handler({
		path: '/api/v1/preauthkey',
		method: 'get',
		response: {}
	}),
	handler({
		path: '/api/v1/preauthkey',
		method: 'post',
		response: async ({ request }) => {
			const body = await request.json();
			return {
				preAuthKey: {
					...body,
					key: randomString(33),
					id: faker.number.octal(),
					createdAt: new Date().toISOString(),
					used: false
				}
			};
		}
	}),

	// Routes
	handler({
		path: '/api/v1/routes',
		method: 'get',
		response: function () {
			return new Promise((resolve, reject) => {
				try {
					const store = database.transaction('routes', 'readwrite').objectStore('routes');
					const query = store.getAll();

					query.onerror = () => reject(query.error);
					query.onsuccess = () => resolve({ routes: query.result });
				} catch (err) {
					reject(err);
				}
			});
		}
	})
];
