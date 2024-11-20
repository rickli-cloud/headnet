import { HttpResponse, http, type HttpResponseInit, type PathParams } from 'msw';
import { faker } from '@faker-js/faker';

import type { paths, RpcStatus, V1Policy } from '$lib/api';

faker.seed(1);

const MAX_ARRAY_LENGTH = 5;
const MIN_ARRAY_LENGTH = 1;

const usersLength = faker.number.int({ min: 3, max: 10 });
const machinesLength = faker.number.int({ min: 30, max: 50 });

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
					givenName: faker.person.lastName(),
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
