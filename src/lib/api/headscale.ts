import createClient, { type Client, type ClientOptions } from 'openapi-fetch';
import type { fetch } from '@tauri-apps/plugin-http';
import { stringify, parse } from 'json-ast-comments';
import { Address4, Address6 } from 'ip-address';
import { get } from 'svelte/store';

import { stripJsonTrailingCommas } from '$lib/utils/json';
import { endSession, Session } from '$lib/store/session';

import { isTauri } from '$lib/utils/tauri';
import { env } from '$env/dynamic/public';
import { uuidv4 } from '$lib/utils/misc';
import { goto } from '$app/navigation';
import { base } from '$app/paths';

import type { components, paths } from './headscale.d';
import { ApiError } from './index';

let tauriFetch: typeof fetch;

if (isTauri()) {
	import('@tauri-apps/plugin-http').then(({ fetch }) => (tauriFetch = fetch));
}

export const registerMethodRegex: RegExp = /^REGISTER_METHOD_/;
export const commentRegex: RegExp = /^\/\/(\s+)?/;
export const groupRegex: RegExp = /^group:/;
export const tagRegex: RegExp = /^tag:/;

export const stringifyComment = (c: string) => (commentRegex.test(c) ? c : `// ${c}\n`);
export const parseComment = (c: string): string => {
	return commentRegex.test(c.trim()) ? c.trim().replace(commentRegex, '') : c.trim();
};

export type ApiPath = keyof paths;
export type ApiMethod = 'get' | 'post' | 'delete' | 'put';

export function parseRegisterMethod(registerMethod: string | undefined) {
	return registerMethod && registerMethodRegex.test(registerMethod)
		? registerMethod.replace(registerMethodRegex, '').toLowerCase().replaceAll(/_/gm, ' ').trim()
		: void 0;
}

export class Headscale {
	public readonly client: Client<paths, `${string}/${string}`>;

	public constructor(clientOptions?: ClientOptions, timeout = 5000) {
		this.client = createClient({
			signal: AbortSignal.timeout(timeout),
			baseUrl: get(Session)?.baseUrl,
			...(clientOptions || {}),
			fetch: isTauri() && env.PUBLIC_MOCK_ENABLED !== 'true' ? tauriFetch : clientOptions?.fetch
		});

		this.client.use({
			async onRequest({ request }) {
				const session = get(Session);
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
	}
}

export type V1User = components['schemas']['v1User'];
export type V1PreAuthKey = components['schemas']['v1PreAuthKey'];
export type V1Route = components['schemas']['v1Route'];
export type V1Node = components['schemas']['v1Node'];
export type V1ApiKey = components['schemas']['v1ApiKey'];

export interface V1Policy {
	/**
	 * groups are collections of users having a common scope. A user can be in multiple groups
	 * groups cannot be composed of groups
	 */
	groups: { [x: string]: string[] };
	/**
	 * tagOwners in tailscale is an association between a TAG and the people allowed to set this TAG on a server.
	 * This is documented [here](https://tailscale.com/kb/1068/acl-tags#defining-a-tag)
	 * and explained [here](https://tailscale.com/blog/rbac-like-it-was-meant-to-be/)
	 */
	tagOwners: { [x: string]: string[] };
	/**
	 * hosts should be defined using its IP addresses and a subnet mask.
	 * to define a single host, use a /32 mask. You cannot use DNS entries here,
	 * as they're prone to be hijacked by replacing their IP addresses.
	 * see https://github.com/tailscale/tailscale/issues/3800 for more information.
	 */
	hosts: { [x: string]: string };
	acls: {
		action: string;
		proto?: string;
		src: string[];
		dst: string[];
	}[];
	// readonly $$comments: {
	// 	readonly $acls?: { [x: number]: string[][] };
	// };
}

export type CommentObj = {
	$$comments: {
		[x: string]: string[][];
	};
};
export interface V1PolicyComments {
	groups: CommentObj;
	tagOwners: CommentObj;
	hosts: CommentObj;
	$$comments: { $acls: { [x: number]: string[][] } };
}

export interface JsonComments {
	[x: string]: string[][];
}

export class User implements V1User {
	public static async list(headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/user');
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: '/api/v1/user' })
				: undefined,
			data: response.data?.users?.map((user) => new User(user))
		};
	}

	public static async find(name: string, headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/user/{name}', {
			params: {
				path: {
					name
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: '/api/v1/user/' + name })
				: undefined,
			data: response.data?.user ? new User(response.data.user) : undefined
		};
	}

	public static async create(name: string, headscale = new Headscale()) {
		const response = await headscale.client.POST('/api/v1/user', {
			body: {
				name
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: '/api/v1/user' })
				: undefined,
			data: response.data?.user ? new User(response.data.user) : undefined
		};
	}

	public readonly name?: string;
	public readonly id?: string;
	public readonly createdAt?: string;

	public constructor(data: V1User) {
		if (!data.name) throw new Error('Name is required to create a new User!');
		Object.assign(this, data);
	}

	public async rename(newName: string, headscale = new Headscale()) {
		if (!this.name) throw new Error("User's name is undefined");
		const response = await headscale.client.POST('/api/v1/user/{oldName}/rename/{newName}', {
			params: {
				path: {
					oldName: this.name,
					newName
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, {
						method: 'POST',
						path: `/api/v1/user/${this.name}/rename/${newName}`
					})
				: undefined,
			data: response.data?.user ? new User(response.data.user) : undefined
		};
	}

	public async delete(headscale = new Headscale()) {
		if (!this.name) throw new Error("User's name is undefined");
		const response = await headscale.client.DELETE('/api/v1/user/{name}', {
			params: {
				path: {
					name: this.name
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'DELETE', path: '/api/v1/user/' + this.name })
				: undefined
		};
	}

	public async getPreAuthKeys(headscale = new Headscale()) {
		if (!this.name) throw new Error("User's name is undefined");
		return await PreAuthKey.find(this.name, headscale);
	}

	public async getMachines(headscale = new Headscale()) {
		return await Machine.list(this.name, headscale);
	}
}

export class PreAuthKey implements V1PreAuthKey {
	public static async list(users: User[], headscale = new Headscale()) {
		const keys = await Promise.all(
			users.map(async (user) => user.getPreAuthKeys(headscale).then(({ data }) => data || []))
		);

		return ([] as PreAuthKey[]).concat(...keys);
	}

	public static async find(user: string, headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/preauthkey', {
			params: {
				query: {
					user
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: '/api/v1/preauthkey' })
				: undefined,
			data: response.data?.preAuthKeys?.map((key) => new PreAuthKey(key))
		};
	}

	public static async create(
		body: components['schemas']['v1CreatePreAuthKeyRequest'],
		headscale = new Headscale()
	) {
		const response = await headscale.client.POST('/api/v1/preauthkey', { body });
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: '/api/v1/preauthkey' })
				: undefined,
			data: response.data?.preAuthKey ? new PreAuthKey(response.data.preAuthKey) : undefined
		};
	}

	public readonly id?: string;
	public readonly key?: string;
	public readonly aclTags?: string[];
	public readonly user?: string;
	public readonly createdAt?: string;
	public readonly expiration?: string;
	public readonly used?: boolean;
	public readonly reusable?: boolean;
	public readonly ephemeral?: boolean;

	public constructor(data: V1PreAuthKey) {
		Object.assign(this, data);
	}

	public async expire(headscale = new Headscale()) {
		const response = await headscale.client.POST('/api/v1/preauthkey/expire', {
			body: {
				key: this.key,
				user: this.user
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: '/api/v1/preauthkey/expire' })
				: undefined
		};
	}
}

export class Route implements V1Route {
	public static async list(headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/routes');
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: '/api/v1/routes' })
				: undefined,
			data: response.data?.routes?.map((route) => new Route(route))
		};
	}

	public readonly id?: string;
	public readonly prefix?: string;
	public readonly advertised?: boolean;
	public readonly enabled?: boolean;
	public readonly isPrimary?: boolean;
	public readonly createdAt?: string;
	public readonly updatedAt?: string;
	public readonly deletedAt?: string;
	public readonly node?: Machine;

	public readonly addr?: Address4 | Address6;

	public get isExit(): boolean {
		return (this.prefix && ['0.0.0.0/0', '::/0'].includes(this.prefix)) || false;
	}

	public constructor(data: V1Route) {
		Object.assign(this, data);

		if (data.node) this.node = new Machine(data.node);

		if (data.prefix) {
			this.addr = Address4.isValid(data.prefix)
				? new Address4(data.prefix)
				: Address6.isValid(data.prefix)
					? new Address6(data.prefix)
					: undefined;
		}
	}

	public async delete(headscale = new Headscale()) {
		if (!this.id) throw new Error('Cannot create route without id.');
		const response = await headscale.client.DELETE('/api/v1/routes/{routeId}', {
			params: {
				path: {
					routeId: this.id
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'DELETE', path: '/api/v1/routes/' + this.id })
				: undefined
		};
	}

	public async disable(headscale = new Headscale()) {
		if (!this.id) throw new Error('Cannot disable route without id.');
		const response = await headscale.client.POST('/api/v1/routes/{routeId}/disable', {
			params: {
				path: {
					routeId: this.id
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, {
						method: 'POST',
						path: `/api/v1/routes/${this.id}/disable`
					})
				: undefined
		};
	}

	public async enable(headscale = new Headscale()) {
		if (!this.id) throw new Error('Cannot enable route without id.');
		const response = await headscale.client.POST('/api/v1/routes/{routeId}/enable', {
			params: {
				path: {
					routeId: this.id
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: `/api/v1/routes/${this.id}/enable` })
				: undefined
		};
	}
}

export class Machine implements V1Node {
	public static async get(nodeId: string, headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/node/{nodeId}', {
			params: {
				path: {
					nodeId
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: '/api/v1/node/' + nodeId })
				: undefined,
			data: response.data?.node ? new Machine(response.data.node) : undefined
		};
	}

	public static async list(user?: string, headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/node', {
			params: {
				query: {
					user
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: '/api/v1/node' })
				: undefined,
			data: response.data?.nodes?.map((machine) => new Machine(machine))
		};
	}

	public static async register(
		query: {
			key: string;
			user: string;
		},
		headscale = new Headscale()
	) {
		const response = await headscale.client.POST('/api/v1/node/register', {
			params: {
				query
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: '/api/v1/node/register' })
				: undefined,
			data: response.data?.node ? new Machine(response.data.node) : undefined
		};
	}

	public readonly id?: string;
	public readonly name?: string;
	public readonly givenName?: string;
	public readonly discoKey?: string;
	public readonly nodeKey?: string;
	public readonly preAuthKey?: V1PreAuthKey;
	public readonly machineKey?: string;
	public readonly user?: V1User;
	public readonly createdAt?: string;
	public readonly lastSuccessfulUpdate?: string;
	public readonly lastSeen?: string;
	public readonly expiry?: string;
	public readonly ipAddresses?: string[];
	public readonly registerMethod?: components['schemas']['v1RegisterMethod'];
	public readonly online?: boolean;
	public readonly invalidTags?: string[];
	public readonly validTags?: string[];
	public readonly forcedTags?: string[];

	public get supportsIpV4(): boolean {
		return !!this.ipAddresses?.find((ip) => Address4.isValid(ip))?.length;
	}
	public get supportsIpV6(): boolean {
		return !!this.ipAddresses?.find((ip) => Address6.isValid(ip))?.length;
	}

	public constructor(data: V1Node) {
		Object.assign(this, data);
	}

	public async delete(headscale = new Headscale()) {
		if (!this.id) throw new Error('Failed to get machine instance id.');
		const response = await headscale.client.DELETE('/api/v1/node/{nodeId}', {
			params: {
				path: {
					nodeId: this.id
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'DELETE', path: '/api/v1/node/' + this.id })
				: undefined
		};
	}

	public async expire(headscale = new Headscale()) {
		if (!this.id) throw new Error('Failed to get machine instance id.');
		const response = await headscale.client.POST('/api/v1/node/{nodeId}/expire', {
			params: {
				path: {
					nodeId: this.id
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: `/api/v1/node/${this.id}/expire` })
				: undefined,
			data: response.data?.node ? new Machine(response.data.node) : undefined
		};
	}

	public async reassign(user: string, headscale = new Headscale()) {
		if (!this.id) throw new Error('Failed to get machine instance id.');
		const response = await headscale.client.POST('/api/v1/node/{nodeId}/user', {
			params: {
				path: {
					nodeId: this.id
				}
			},
			body: {
				user
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: `/api/v1/node/${this.id}/user` })
				: undefined,
			data: response.data?.node ? new Machine(response.data.node) : undefined
		};
	}

	public async rename(newName: string, headscale = new Headscale()) {
		if (!this.id) throw new Error('Failed to get machine instance id.');
		const response = await headscale.client.POST('/api/v1/node/{nodeId}/rename/{newName}', {
			params: {
				path: {
					nodeId: this.id,
					newName
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, {
						method: 'POST',
						path: `/api/v1/node/${this.id}/rename/${newName}`
					})
				: undefined,
			data: response.data?.node ? new Machine(response.data.node) : undefined
		};
	}

	public async setTags(tags: string[], headscale = new Headscale()) {
		if (!this.id) throw new Error('Failed to get machine instance id.');
		const response = await headscale.client.POST('/api/v1/node/{nodeId}/tags', {
			params: {
				path: {
					nodeId: this.id
				}
			},
			body: {
				tags: tags.map((tag) => (tagRegex.test(tag) ? tag : `tag:${tag}`))
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: `/api/v1/node/${this.id}/tags` })
				: undefined,
			data: response.data?.node ? new Machine(response.data.node) : undefined
		};
	}

	public async getRoutes(headscale = new Headscale()) {
		if (!this.id) throw new Error('Failed to get machine instance id.');
		const response = await headscale.client.GET('/api/v1/node/{nodeId}/routes', {
			params: {
				path: {
					nodeId: this.id
				}
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: `/api/v1/node/${this.id}/routes` })
				: undefined,
			data: response.data?.routes?.map((route) => new Route(route))
		};
	}
}

export class ApiKey implements V1ApiKey {
	public static async list(headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/apikey');
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'GET', path: '/api/v1/apikey' })
				: undefined,
			data: response.data?.apiKeys?.map((key) => new ApiKey(key))
		};
	}

	public static async create(
		key: {
			expiration: string | number | Date;
		},
		headscale = new Headscale()
	) {
		const response = await headscale.client.POST('/api/v1/apikey', {
			body: {
				expiration: (key.expiration instanceof Date
					? key.expiration
					: new Date(key.expiration)
				).toISOString()
			}
		});

		// No data parsing required as it only returns the new API key as string
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: '/api/v1/apikey' })
				: undefined
		};
	}

	public readonly id?: string;
	public readonly prefix?: string;
	public readonly createdAt?: string;
	public readonly expiration?: string;
	public readonly lastSeen?: string;

	public constructor(data: V1ApiKey) {
		Object.assign(this, data);
	}

	public async expire(headscale = new Headscale()) {
		const response = await headscale.client.POST('/api/v1/apikey/expire', {
			body: {
				prefix: this.prefix
			}
		});
		return {
			...response,
			error: response.error
				? new ApiError(response.error, { method: 'POST', path: '/api/v1/apikey/expire' })
				: undefined
		};
	}
}

export interface AclData {
	hosts: {
		name: string;
		cidr: string;
		comments?: string[];
	}[];
	groups: {
		name: string;
		members: string[];
		comments?: string[];
	}[];
	tagOwners: {
		name: string;
		members: string[];
		comments?: string[];
	}[];
	acls: {
		id: string;
		action: string;
		src: string[];
		dst: { host: string; port: string }[];
		proto?: string;
		comments?: string[];
	}[];
}

export class Acl {
	public static async load(headscale = new Headscale()) {
		const response = await headscale.client.GET('/api/v1/policy');

		try {
			return {
				...response,
				data: new Acl(response.data),
				error: response.error
					? new ApiError(response.error, { method: 'GET', path: '/api/v1/policy' })
					: undefined
			};
		} catch (err) {
			return {
				...response,
				data: new Acl({}),
				error: err
			};
		}
	}

	protected static parsePolicy(policy: string) {
		const p: V1Policy = policy?.length ? parse(stripJsonTrailingCommas(policy)) : undefined;
		const comments = p as unknown as V1PolicyComments;

		return {
			policy: p,
			comments,
			hosts: Object.entries(p?.hosts || {})
				.filter(([key]) => key !== '$$comments')
				.map(([name, cidr]) => ({
					name,
					cidr,
					comments: comments.hosts?.$$comments?.[name]?.[0].map(parseComment)
				})),
			groups: Object.entries(p?.groups || {})
				.filter(([key]) => key !== '$$comments')
				.map(([name, members]) => ({
					name,
					members,
					comments: comments.groups?.$$comments?.[name]?.[0].map(parseComment)
				})),
			tagOwners: Object.entries(p?.tagOwners || {})
				.filter(([key]) => key !== '$$comments')
				.map(([name, members]) => ({
					name,
					members,
					comments: comments.tagOwners?.$$comments?.[name]?.[0].map(parseComment)
				})),
			acls:
				p?.acls.map((val, index) => ({
					...val,
					id: uuidv4(),
					comments: comments.$$comments?.$acls?.[index]?.[0].map(parseComment),
					dst: val.dst?.map((i) => {
						const lastIndex = i.lastIndexOf(':');
						return {
							host: i.slice(0, lastIndex),
							port: i.slice(lastIndex + 1, i.length + 1)
						};
					})
				})) || []
		};
	}

	/** Do NOT make any changes here as they will NOT be saved! */
	protected readonly policy: V1Policy;

	protected get comments(): V1PolicyComments {
		const comments = this.policy as unknown as V1PolicyComments;

		return {
			$$comments: comments?.$$comments || {},
			hosts: { $$comments: comments?.hosts?.$$comments || {} },
			groups: { $$comments: comments?.groups?.$$comments || {} },
			tagOwners: { $$comments: comments?.tagOwners?.$$comments || {} }
		};
	}

	public readonly updatedAt?: string;
	public hosts: AclData['hosts'];
	public groups: AclData['groups'];
	public tagOwners: AclData['tagOwners'];
	public acls: AclData['acls'];

	public constructor(data: { policy?: string; updatedAt?: string } | undefined) {
		this.updatedAt = data?.updatedAt;

		if (data?.policy) {
			const acl = Acl.parsePolicy(data.policy);

			this.policy = acl.policy;
			this.hosts = acl.hosts;
			this.groups = acl.groups;
			this.tagOwners = acl.tagOwners;
			this.acls = acl.acls;
		} else {
			this.policy = { hosts: {}, groups: {}, tagOwners: {}, acls: [] };
			this.hosts = [];
			this.groups = [];
			this.tagOwners = [];
			this.acls = [];
		}
	}

	public stringify(): string {
		const comments = this.comments;

		if (typeof comments.hosts.$$comments !== 'object') comments.hosts.$$comments = {};
		if (typeof comments.groups.$$comments !== 'object') comments.groups.$$comments = {};
		if (typeof comments.tagOwners.$$comments !== 'object') comments.tagOwners.$$comments = {};
		if (typeof comments.$$comments !== 'object') comments.$$comments = { $acls: {} };
		else if (typeof comments.$$comments.$acls !== 'object') comments.$$comments.$acls = {};

		const policy: V1Policy = {
			hosts: Object.fromEntries(
				this.hosts.map((host, i) => {
					comments.hosts.$$comments[i] = [host.comments?.map(stringifyComment) || []];
					return [host.name, host.cidr];
				})
			),
			groups: Object.fromEntries(
				this.groups.map((group, i) => {
					comments.groups.$$comments[i] = [group.comments?.map(stringifyComment) || []];
					return [group.name, group.members];
				})
			),
			tagOwners: Object.fromEntries(
				this.tagOwners.map((tagOwners, i) => {
					comments.tagOwners.$$comments[i] = [tagOwners.comments?.map(stringifyComment) || []];
					return [tagOwners.name, tagOwners.members];
				})
			),
			acls: this.acls.map((acl, i) => {
				comments.$$comments.$acls[i] = [acl.comments?.map(stringifyComment) || []];
				const dst = acl.dst.map((i) => i.host + ':' + i.port);
				const newAcl: { [x: string]: unknown } = JSON.parse(JSON.stringify(acl));
				delete newAcl.comments;
				delete newAcl.id;
				return { ...(newAcl as typeof acl), dst };
			})
		};

		return stringify({
			...this.policy,
			...comments,
			...policy,
			hosts: {
				$$comments: comments.hosts.$$comments,
				...policy.hosts
			},
			groups: {
				$$comments: comments.groups.$$comments,
				...policy.groups
			},
			tagOwners: {
				$$comments: comments.tagOwners.$$comments,
				...policy.tagOwners
			}
		});
	}

	public async save(policy = this.stringify(), headscale = new Headscale()) {
		const response = await headscale.client.PUT('/api/v1/policy', {
			body: { policy }
		});

		return {
			...response,
			data: new Acl(response.data),
			error: response.error
				? new ApiError(response.error, { method: 'PUT', path: '/api/v1/policy' })
				: undefined
		};
	}
}
