import { HttpResponse, http, type HttpResponseInit, type PathParams } from 'msw';
import { faker } from '@faker-js/faker';

import type { paths, RpcStatus, V1Policy } from '$lib/api';

faker.seed(1);

// const baseURL = '';
const MAX_ARRAY_LENGTH = 5;
const MIN_ARRAY_LENGTH = 1;

const usersLength = faker.number.int({ min: 3, max: 10 });
const machinesLength = faker.number.int({ min: 30, max: 50 });

/* let i = 0;
const next = () => {
	if (i === Number.MAX_SAFE_INTEGER - 1) {
		i = 0;
	}
	return i++;
}; */

const simulateApiError: boolean = false;

type ApiMethod = 'get' | 'post' | 'delete' | 'put';

type ApiPath = keyof paths;

interface ApiOperation {
	requestBody?: {
		content?: {
			'application/json': object;
		};
	};
	responses?: {
		[x: string | number]: object;
	};
}

type ApiOperationRequestBody = NonNullable<ApiOperation['requestBody']>;

type ApiResponse<
	Path extends ApiPath,
	Method extends ApiMethod
> = paths[Path][Method] extends ApiOperation
	? paths[Path][Method]['responses'][200]['content']['application/json']
	: never;

type ApiRequestBody<
	Path extends ApiPath,
	Method extends ApiMethod
> = paths[Path][Method] extends ApiOperation
	? paths[Path][Method]['requestBody'] extends ApiOperationRequestBody
		? paths[Path][Method]['requestBody']['content']['application/json']
		: never
	: never;

type HttpRequestData<Path extends ApiPath, Method extends ApiMethod> = Parameters<
	Parameters<typeof http.get<PathParams, ApiRequestBody<Path, Method>>>[1]
>[0];

function handler<Path extends ApiPath, Method extends ApiMethod>(opt: {
	path: Path;
	method: Method;
	init?: HttpResponseInit;
	response:
		| ApiResponse<Path, Method>
		| ((data: HttpRequestData<Path, Method>) => ApiResponse<Path, Method>)
		| ((data: HttpRequestData<Path, Method>) => Promise<ApiResponse<Path, Method>>);
}) {
	return http[opt.method]<
		PathParams,
		ApiRequestBody<Path, Method>,
		ApiResponse<Path, Method> | RpcStatus,
		Path
	>(opt.path, async (data) => {
		// TODO: Check auth header

		if (simulateApiError) {
			// Maybe only throw errors at random?
			return HttpResponse.json(
				{
					code: 500,
					message: 'Internal server error',
					details: [{ '@type': 'Mocking API server failure' }]
				} as RpcStatus,
				{ status: 500 }
			);
		}

		return HttpResponse.json(
			typeof opt.response === 'function' ? await opt.response(data) : opt.response,
			{
				status: 200,
				...opt.init
			}
		);
	});
}

function randomSizedArray<T>(
	handle: (i: number) => T,
	size: number = faker.number.int({ min: MIN_ARRAY_LENGTH, max: MAX_ARRAY_LENGTH })
): T[] {
	return [...new Array(size).keys()].map((i) => handle(i));
}

const usernames = [...new Array(usersLength).keys()].map(() => faker.person.firstName());
const groups = Object.fromEntries(
	randomSizedArray(() => [
		'group:' + faker.person.firstName(),
		randomSizedArray(
			() => usernames[faker.number.int({ min: 0, max: usersLength - 1 })],
			faker.number.int({ min: 0, max: 3 })
		)
	])
);

export const handlers = [
	// API keys
	handler({
		path: '/api/v1/apikey',
		method: 'get',
		response: {
			apiKeys: randomSizedArray(() => ({
				id: faker.number.octal(),
				prefix: faker.lorem.words(),
				expiration: faker.date.past().toISOString(),
				createdAt: faker.date.past().toISOString(),
				lastSeen: faker.date.past().toISOString()
			}))
		}
	}),
	handler({
		path: '/api/v1/apikey',
		method: 'post',
		response: () => ({
			apiKey: btoa(window.crypto.getRandomValues(new Uint8Array(8)).toString()).replace(/=+$/, '')
		})
	}),
	handler({
		path: '/api/v1/apikey/expire',
		method: 'post',
		response: {}
	}),
	handler({
		path: '/api/v1/apikey/{prefix}',
		method: 'delete',
		response: {}
	}),

	// Nodes
	handler({
		path: '/api/v1/node',
		method: 'get',
		response: {
			nodes: randomSizedArray(
				(id) => ({
					id: String(id),
					name: faker.person.lastName(),
					given: faker.person.lastName(),
					createdAt: faker.date.recent().toISOString(),
					expiry: faker.date.soon().toISOString(),
					lastSeen: faker.date.recent().toISOString(),
					registerMethod: 'REGISTER_METHOD_UNSPECIFIED',
					online: faker.datatype.boolean(),
					discoKey: `discokey:${btoa(window.crypto.getRandomValues(new Uint8Array(10)).toString()).replace(/=+$/, '')}`,
					nodeKey: `nodekey:${btoa(window.crypto.getRandomValues(new Uint8Array(10)).toString()).replace(/=+$/, '')}`,
					machineKey: `mkey:${btoa(window.crypto.getRandomValues(new Uint8Array(10)).toString()).replace(/=+$/, '')}`,
					invalidTags: [],
					forcedTags: [],
					validTags: [],
					user: {
						id: faker.number.octal({ min: 1, max: usersLength - 1 })
					},
					ipAddresses: [faker.internet.ipv4(), faker.internet.ipv6()]
				}),
				machinesLength
			)
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
		path: '/api/v1/node/{nodeId}/expire',
		method: 'post',
		response: {
			node: {}
		}
	}),
	handler({
		path: '/api/v1/node/{nodeId}/rename/{newName}',
		method: 'post',
		response: {
			node: {}
		}
	}),
	handler({
		path: '/api/v1/node/{nodeId}/routes',
		method: 'get',
		response: {
			routes: []
		}
	}),
	handler({
		path: '/api/v1/node/{nodeId}/tags',
		method: 'post',
		response: {
			node: {}
		}
	}),
	handler({
		path: '/api/v1/node/{nodeId}/user',
		method: 'post',
		response: {
			node: {}
		}
	}),

	// Policy
	handler({
		path: '/api/v1/policy',
		method: 'get',
		response: {
			policy: JSON.stringify({
				Hosts: {
					demo: '172.20.10.1/32'
				},
				tagOwners: {
					'tag:demo': ['group:demo']
				},
				groups: {
					...groups,
					'group:internet': randomSizedArray(
						() => usernames[faker.number.int({ min: 0, max: usersLength - 1 })]
					)
				},
				acls: [
					...randomSizedArray(
						() => ({
							action: 'accept',
							src: [
								Object.keys(groups)[
									faker.number.int({ min: 0, max: Object.keys(groups).length - 1 })
								]
							],
							dst: [
								Object.keys(groups)[
									faker.number.int({ min: 0, max: Object.keys(groups).length - 1 })
								] + ':*'
							]
						}),
						faker.number.int({ min: 2, max: Object.keys(groups).length })
					),
					{
						action: 'accept',
						src: ['group:internet'],
						dst: ['autogroup:internet:*']
					},
					{
						action: 'accept',
						src: ['*'],
						dst: ['demo:*']
					}
				]
			} as V1Policy),
			updatedAt: faker.date.recent().toISOString()
		}
	}),
	handler({
		path: '/api/v1/policy',
		method: 'put',
		response: async ({ request }) => await request.json()
	}),

	// Pre auth keys
	handler({
		path: '/api/v1/preauthkey',
		method: 'get',
		response: {}
	}),

	// Routes
	handler({
		path: '/api/v1/routes',
		method: 'get',
		response: {
			routes: [
				{
					id: '0',
					advertised: true,
					enabled: true,
					isPrimary: true,
					createdAt: faker.date.recent().toISOString(),
					node: { id: '0' },
					prefix: '172.20.10.1/32'
				},
				...randomSizedArray(() => ({
					id: String(faker.number.int({ min: 1, max: 1000 })),
					advertised: true,
					enabled: true,
					createdAt: faker.date.recent().toISOString(),
					node: { id: faker.number.octal({ min: 0, max: machinesLength - 1 }) },
					prefix: '0.0.0.0/0'
				})),
				...randomSizedArray(() => ({
					id: String(faker.number.int({ min: 1000, max: 2000 })),
					advertised: true,
					enabled: true,
					createdAt: faker.date.recent().toISOString(),
					node: { id: faker.number.octal({ min: 0, max: machinesLength - 1 }) },
					prefix: '::/0'
				}))
			]
		}
	}),

	// Users
	handler({
		path: '/api/v1/user',
		method: 'get',
		response: {
			users: [...new Array(usersLength).keys()].map((id) => ({
				id: String(id),
				name: usernames[id] || faker.person.firstName(),
				createdAt: faker.date.recent().toISOString()
			}))
		}
	}),
	handler({
		path: '/api/v1/user',
		method: 'post',
		response: async ({ request }) => {
			return {
				user: {
					...(await request.json()),
					createdAt: new Date().toISOString(),
					id: String(faker.number.int({ min: 10, max: 100 }))
				}
			};
		}
	})
];

/* export const oldHandlers = [
	http.get(`${baseURL}/api/v1/apikey`, async () => {
		const resultArray = [
			[await getHeadscaleServiceListApiKeys200Response(), { status: 200 }],
			[await getHeadscaleServiceListApiKeysdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/apikey`, async () => {
		const resultArray = [
			[await getHeadscaleServiceCreateApiKey200Response(), { status: 200 }],
			[await getHeadscaleServiceCreateApiKeydefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/apikey/expire`, async () => {
		const resultArray = [
			[await getHeadscaleServiceExpireApiKey200Response(), { status: 200 }],
			[await getHeadscaleServiceExpireApiKeydefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.delete(`${baseURL}/api/v1/apikey/:prefix`, async () => {
		const resultArray = [
			[await getHeadscaleServiceDeleteApiKey200Response(), { status: 200 }],
			[await getHeadscaleServiceDeleteApiKeydefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/debug/node`, async () => {
		const resultArray = [
			[await getHeadscaleServiceDebugCreateNode200Response(), { status: 200 }],
			[await getHeadscaleServiceDebugCreateNodedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/node`, async () => {
		const resultArray = [
			[await getHeadscaleServiceListNodes200Response(), { status: 200 }],
			[await getHeadscaleServiceListNodesdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/node/backfillips`, async () => {
		const resultArray = [
			[await getHeadscaleServiceBackfillNodeIPs200Response(), { status: 200 }],
			[await getHeadscaleServiceBackfillNodeIPsdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/node/register`, async () => {
		const resultArray = [
			[await getHeadscaleServiceRegisterNode200Response(), { status: 200 }],
			[await getHeadscaleServiceRegisterNodedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/node/:nodeId`, async () => {
		const resultArray = [
			[await getHeadscaleServiceGetNode200Response(), { status: 200 }],
			[await getHeadscaleServiceGetNodedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.delete(`${baseURL}/api/v1/node/:nodeId`, async () => {
		const resultArray = [
			[await getHeadscaleServiceDeleteNode200Response(), { status: 200 }],
			[await getHeadscaleServiceDeleteNodedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/node/:nodeId/expire`, async () => {
		const resultArray = [
			[await getHeadscaleServiceExpireNode200Response(), { status: 200 }],
			[await getHeadscaleServiceExpireNodedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/node/:nodeId/rename/:newName`, async () => {
		const resultArray = [
			[await getHeadscaleServiceRenameNode200Response(), { status: 200 }],
			[await getHeadscaleServiceRenameNodedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/node/:nodeId/routes`, async () => {
		const resultArray = [
			[await getHeadscaleServiceGetNodeRoutes200Response(), { status: 200 }],
			[await getHeadscaleServiceGetNodeRoutesdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/node/:nodeId/tags`, async () => {
		const resultArray = [
			[await getHeadscaleServiceSetTags200Response(), { status: 200 }],
			[await getHeadscaleServiceSetTagsdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/node/:nodeId/user`, async () => {
		const resultArray = [
			[await getHeadscaleServiceMoveNode200Response(), { status: 200 }],
			[await getHeadscaleServiceMoveNodedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/policy`, async () => {
		const resultArray = [
			[await getHeadscaleServiceGetPolicy200Response(), { status: 200 }],
			[await getHeadscaleServiceGetPolicydefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.put(`${baseURL}/api/v1/policy`, async () => {
		const resultArray = [
			[await getHeadscaleServiceSetPolicy200Response(), { status: 200 }],
			[await getHeadscaleServiceSetPolicydefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/preauthkey`, async () => {
		const resultArray = [
			[await getHeadscaleServiceListPreAuthKeys200Response(), { status: 200 }],
			[await getHeadscaleServiceListPreAuthKeysdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/preauthkey`, async () => {
		const resultArray = [
			[await getHeadscaleServiceCreatePreAuthKey200Response(), { status: 200 }],
			[await getHeadscaleServiceCreatePreAuthKeydefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/preauthkey/expire`, async () => {
		const resultArray = [
			[await getHeadscaleServiceExpirePreAuthKey200Response(), { status: 200 }],
			[await getHeadscaleServiceExpirePreAuthKeydefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/routes`, async () => {
		const resultArray = [
			[await getHeadscaleServiceGetRoutes200Response(), { status: 200 }],
			[await getHeadscaleServiceGetRoutesdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.delete(`${baseURL}/api/v1/routes/:routeId`, async () => {
		const resultArray = [
			[await getHeadscaleServiceDeleteRoute200Response(), { status: 200 }],
			[await getHeadscaleServiceDeleteRoutedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/routes/:routeId/disable`, async () => {
		const resultArray = [
			[await getHeadscaleServiceDisableRoute200Response(), { status: 200 }],
			[await getHeadscaleServiceDisableRoutedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/routes/:routeId/enable`, async () => {
		const resultArray = [
			[await getHeadscaleServiceEnableRoute200Response(), { status: 200 }],
			[await getHeadscaleServiceEnableRoutedefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/user`, async () => {
		const resultArray = [
			[await getHeadscaleServiceListUsers200Response(), { status: 200 }],
			[await getHeadscaleServiceListUsersdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/user`, async () => {
		const resultArray = [
			[await getHeadscaleServiceCreateUser200Response(), { status: 200 }],
			[await getHeadscaleServiceCreateUserdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.get(`${baseURL}/api/v1/user/:name`, async () => {
		const resultArray = [
			[await getHeadscaleServiceGetUser200Response(), { status: 200 }],
			[await getHeadscaleServiceGetUserdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.delete(`${baseURL}/api/v1/user/:name`, async () => {
		const resultArray = [
			[await getHeadscaleServiceDeleteUser200Response(), { status: 200 }],
			[await getHeadscaleServiceDeleteUserdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	}),
	http.post(`${baseURL}/api/v1/user/:oldName/rename/:newName`, async () => {
		const resultArray = [
			[await getHeadscaleServiceRenameUser200Response(), { status: 200 }],
			[await getHeadscaleServiceRenameUserdefaultResponse(), { status: 500 }]
		];

		return HttpResponse.json(...resultArray[next() % resultArray.length]);
	})
];

export function getHeadscaleServiceListApiKeys200Response() {
	return {
		apiKeys: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				id: faker.number.octal(),
				prefix: faker.lorem.words(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				lastSeen: faker.date.past()
			})
		)
	};
}

export function getHeadscaleServiceListApiKeysdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceCreateApiKey200Response() {
	return {
		apiKey: faker.lorem.words()
	};
}

export function getHeadscaleServiceCreateApiKeydefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceExpireApiKey200Response() {
	return {};
}

export function getHeadscaleServiceExpireApiKeydefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceDeleteApiKey200Response() {
	return {};
}

export function getHeadscaleServiceDeleteApiKeydefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceDebugCreateNode200Response() {
	return {
		node: {
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}
	};
}

export function getHeadscaleServiceDebugCreateNodedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceListNodes200Response() {
	return {
		nodes: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map((_) => ({
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}))
	};
}

export function getHeadscaleServiceListNodesdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceBackfillNodeIPs200Response() {
	return {
		changes: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map((_) =>
			faker.lorem.words()
		)
	};
}

export function getHeadscaleServiceBackfillNodeIPsdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceRegisterNode200Response() {
	return {
		node: {
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}
	};
}

export function getHeadscaleServiceRegisterNodedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceGetNode200Response() {
	return {
		node: {
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}
	};
}

export function getHeadscaleServiceGetNodedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceDeleteNode200Response() {
	return {};
}

export function getHeadscaleServiceDeleteNodedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceExpireNode200Response() {
	return {
		node: {
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}
	};
}

export function getHeadscaleServiceExpireNodedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceRenameNode200Response() {
	return {
		node: {
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}
	};
}

export function getHeadscaleServiceRenameNodedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceGetNodeRoutes200Response() {
	return {
		routes: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map((_) => ({
			id: faker.number.octal(),
			node: {
				id: faker.number.octal(),
				machineKey: faker.lorem.words(),
				nodeKey: faker.lorem.words(),
				discoKey: faker.lorem.words(),
				ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				name: faker.person.fullName(),
				user: {
					id: faker.number.octal(),
					name: faker.person.fullName(),
					createdAt: faker.date.past()
				},
				lastSeen: faker.date.past(),
				expiry: faker.date.past(),
				preAuthKey: {
					user: faker.lorem.words(),
					id: faker.number.octal(),
					key: faker.lorem.words(),
					reusable: faker.datatype.boolean(),
					ephemeral: faker.datatype.boolean(),
					used: faker.datatype.boolean(),
					expiration: faker.date.past(),
					createdAt: faker.date.past(),
					aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
						(_) => faker.lorem.words()
					)
				},
				createdAt: faker.date.past(),
				registerMethod: faker.helpers.arrayElement([
					'REGISTER_METHOD_UNSPECIFIED',
					'REGISTER_METHOD_AUTH_KEY',
					'REGISTER_METHOD_CLI',
					'REGISTER_METHOD_OIDC'
				]),
				forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				givenName: faker.person.fullName(),
				online: faker.datatype.boolean()
			},
			prefix: faker.lorem.words(),
			advertised: faker.datatype.boolean(),
			enabled: faker.datatype.boolean(),
			isPrimary: faker.datatype.boolean(),
			createdAt: faker.date.past(),
			updatedAt: faker.date.past(),
			deletedAt: faker.date.past()
		}))
	};
}

export function getHeadscaleServiceGetNodeRoutesdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceSetTags200Response() {
	return {
		node: {
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}
	};
}

export function getHeadscaleServiceSetTagsdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceMoveNode200Response() {
	return {
		node: {
			id: faker.number.octal(),
			machineKey: faker.lorem.words(),
			nodeKey: faker.lorem.words(),
			discoKey: faker.lorem.words(),
			ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			name: faker.person.fullName(),
			user: {
				id: faker.number.octal(),
				name: faker.person.fullName(),
				createdAt: faker.date.past()
			},
			lastSeen: faker.date.past(),
			expiry: faker.date.past(),
			preAuthKey: {
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			},
			createdAt: faker.date.past(),
			registerMethod: faker.helpers.arrayElement([
				'REGISTER_METHOD_UNSPECIFIED',
				'REGISTER_METHOD_AUTH_KEY',
				'REGISTER_METHOD_CLI',
				'REGISTER_METHOD_OIDC'
			]),
			forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
				(_) => faker.lorem.words()
			),
			givenName: faker.person.fullName(),
			online: faker.datatype.boolean()
		}
	};
}

export function getHeadscaleServiceMoveNodedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceGetPolicy200Response() {
	return {
		policy: '{}',
		updatedAt: faker.date.past()
	};
}

export function getHeadscaleServiceGetPolicydefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceSetPolicy200Response() {
	return {
		policy: '{}',
		updatedAt: faker.date.past()
	};
}

export function getHeadscaleServiceSetPolicydefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceListPreAuthKeys200Response() {
	return {
		preAuthKeys: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				user: faker.lorem.words(),
				id: faker.number.octal(),
				key: faker.lorem.words(),
				reusable: faker.datatype.boolean(),
				ephemeral: faker.datatype.boolean(),
				used: faker.datatype.boolean(),
				expiration: faker.date.past(),
				createdAt: faker.date.past(),
				aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				)
			})
		)
	};
}

export function getHeadscaleServiceListPreAuthKeysdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceCreatePreAuthKey200Response() {
	return {
		preAuthKey: {
			user: faker.lorem.words(),
			id: faker.number.octal(),
			key: faker.lorem.words(),
			reusable: faker.datatype.boolean(),
			ephemeral: faker.datatype.boolean(),
			used: faker.datatype.boolean(),
			expiration: faker.date.past(),
			createdAt: faker.date.past(),
			aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map((_) =>
				faker.lorem.words()
			)
		}
	};
}

export function getHeadscaleServiceCreatePreAuthKeydefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceExpirePreAuthKey200Response() {
	return {};
}

export function getHeadscaleServiceExpirePreAuthKeydefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceGetRoutes200Response() {
	return {
		routes: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map((_) => ({
			id: faker.number.octal(),
			node: {
				id: faker.number.octal(),
				machineKey: faker.lorem.words(),
				nodeKey: faker.lorem.words(),
				discoKey: faker.lorem.words(),
				ipAddresses: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				name: faker.person.fullName(),
				user: {
					id: faker.number.octal(),
					name: faker.person.fullName(),
					createdAt: faker.date.past()
				},
				lastSeen: faker.date.past(),
				expiry: faker.date.past(),
				preAuthKey: {
					user: faker.lorem.words(),
					id: faker.number.octal(),
					key: faker.lorem.words(),
					reusable: faker.datatype.boolean(),
					ephemeral: faker.datatype.boolean(),
					used: faker.datatype.boolean(),
					expiration: faker.date.past(),
					createdAt: faker.date.past(),
					aclTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
						(_) => faker.lorem.words()
					)
				},
				createdAt: faker.date.past(),
				registerMethod: faker.helpers.arrayElement([
					'REGISTER_METHOD_UNSPECIFIED',
					'REGISTER_METHOD_AUTH_KEY',
					'REGISTER_METHOD_CLI',
					'REGISTER_METHOD_OIDC'
				]),
				forcedTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				invalidTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				validTags: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
					(_) => faker.lorem.words()
				),
				givenName: faker.person.fullName(),
				online: faker.datatype.boolean()
			},
			prefix: faker.internet.ipv4() + '/32',
			advertised: faker.datatype.boolean(),
			enabled: faker.datatype.boolean(),
			isPrimary: faker.datatype.boolean(),
			createdAt: faker.date.past(),
			updatedAt: faker.date.past(),
			deletedAt: undefined
		}))
	};
}

export function getHeadscaleServiceGetRoutesdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceDeleteRoute200Response() {
	return {};
}

export function getHeadscaleServiceDeleteRoutedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceDisableRoute200Response() {
	return {};
}

export function getHeadscaleServiceDisableRoutedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceEnableRoute200Response() {
	return {};
}

export function getHeadscaleServiceEnableRoutedefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceListUsers200Response() {
	return {
		users: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map((_) => ({
			id: faker.number.octal(),
			name: faker.person.fullName(),
			createdAt: faker.date.past()
		}))
	};
}

export function getHeadscaleServiceListUsersdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceCreateUser200Response() {
	return {
		user: {
			id: faker.number.octal(),
			name: faker.person.fullName(),
			createdAt: faker.date.past()
		}
	};
}

export function getHeadscaleServiceCreateUserdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceGetUser200Response() {
	return {
		user: {
			id: faker.number.octal(),
			name: faker.person.fullName(),
			createdAt: faker.date.past()
		}
	};
}

export function getHeadscaleServiceGetUserdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceDeleteUser200Response() {
	return {};
}

export function getHeadscaleServiceDeleteUserdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
}

export function getHeadscaleServiceRenameUser200Response() {
	return {
		user: {
			id: faker.number.octal(),
			name: faker.person.fullName(),
			createdAt: faker.date.past()
		}
	};
}

export function getHeadscaleServiceRenameUserdefaultResponse() {
	return {
		code: faker.number.int(),
		message: faker.lorem.words(),
		details: [...new Array(faker.number.int({ min: 1, max: MAX_ARRAY_LENGTH })).keys()].map(
			(_) => ({
				'@type': faker.lorem.words()
			})
		)
	};
} */
