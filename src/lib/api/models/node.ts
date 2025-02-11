import { Address4, Address6 } from 'ip-address';

import { handleResponseError, type ApiResponse, type RequestOptions } from '../utils';
import type { components } from '../gen/headscale';
import { Headscale } from '../headscale';
import { tagRegex } from '../regex';

import type { V1PreAuthKey } from './preAuthKey';
import type { V1User } from './user';
import { Route } from './route';

export type V1Node = components['schemas']['v1Node'];

export class Node implements V1Node {
	public static async list(
		headscale: Headscale,
		opt?: RequestOptions & { data?: { user?: string } }
	): ApiResponse<Node[]> {
		const { data, ...arg } = opt || {};

		const res = await headscale.client.GET('/api/v1/node', {
			...arg,
			params: {
				query: {
					user: data?.user
				}
			}
		});

		return {
			data: res.data?.nodes?.map((machine) => new Node(machine)),
			error: handleResponseError(res)
		};
	}

	public static async get(
		headscale: Headscale,
		opt: RequestOptions & { data: { nodeId: string } }
	): ApiResponse<Node> {
		const { data, ...arg } = opt;

		const res = await headscale.client.GET('/api/v1/node/{nodeId}', {
			params: {
				path: {
					nodeId: data.nodeId
				}
			}
		});

		return {
			data: res.data?.node ? new Node(res.data.node) : undefined,
			error: handleResponseError(res)
		};
	}

	public static async register(
		headscale: Headscale,
		opt: RequestOptions & { data: { user: string; key: string } }
	): ApiResponse<Node> {
		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/node/register', {
			...arg,
			params: {
				query: {
					user: data.user,
					key: data.key
				}
			}
		});

		return {
			data: res.data?.node ? new Node(res.data.node) : undefined,
			error: handleResponseError(res)
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

	public async delete(
		headscale: Headscale,
		opt?: RequestOptions
	): ApiResponse<Record<string, never>> {
		if (!this.id) throw new Error('Failed to get machine instance id.');

		const res = await headscale.client.DELETE('/api/v1/node/{nodeId}', {
			...(opt || {}),
			params: {
				path: {
					nodeId: this.id
				}
			}
		});

		return {
			data: res.data,
			error: handleResponseError(res)
		};
	}

	public async expire(headscale: Headscale, opt?: RequestOptions): ApiResponse<Node> {
		if (!this.id) throw new Error('Failed to get machine instance id.');

		const res = await headscale.client.POST('/api/v1/node/{nodeId}/expire', {
			...(opt || {}),
			params: {
				path: {
					nodeId: this.id
				}
			}
		});

		if (res.data?.node) {
			Object.assign(this, res.data.node);
		}

		return {
			data: this,
			error: handleResponseError(res)
		};
	}

	public async reassign(
		headscale: Headscale,
		opt: RequestOptions & { data: { user: string } }
	): ApiResponse<Node> {
		if (!this.id) throw new Error('Failed to get machine instance id.');

		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/node/{nodeId}/user', {
			...arg,
			body: data,
			params: {
				path: {
					nodeId: this.id
				}
			}
		});

		if (res.data?.node) {
			Object.assign(this, res.data.node);
		}

		return {
			data: this,
			error: handleResponseError(res)
		};
	}

	public async rename(
		headscale: Headscale,
		opt: RequestOptions & { data: { newName: string } }
	): ApiResponse<Node> {
		if (!this.id) throw new Error('Failed to get machine instance id.');

		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/node/{nodeId}/rename/{newName}', {
			...arg,
			params: {
				path: {
					newName: data.newName,
					nodeId: this.id
				}
			}
		});

		if (res.data?.node) {
			Object.assign(this, res.data.node);
		}

		return {
			data: this,
			error: handleResponseError(res)
		};
	}

	public async updateTags(
		headscale: Headscale,
		opt: RequestOptions & { data: { tags: string[] } }
	): ApiResponse<Node> {
		if (!this.id) throw new Error('Failed to get machine instance id.');

		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/node/{nodeId}/tags', {
			...arg,
			params: {
				path: {
					nodeId: this.id
				}
			},
			body: {
				tags: (data.tags || []).map((tag) => (tagRegex.test(tag) ? tag : `tag:${tag}`))
			}
		});

		if (res.data?.node) {
			Object.assign(this, res.data.node);
		}

		return {
			data: this,
			error: handleResponseError(res)
		};
	}

	public async getRoutes(headscale: Headscale, opt?: RequestOptions): ApiResponse<Route[]> {
		if (!this.id) throw new Error('Failed to get machine instance id.');

		const res = await headscale.client.GET('/api/v1/node/{nodeId}/routes', {
			...(opt || {}),
			params: {
				path: {
					nodeId: this.id
				}
			}
		});

		return {
			data: res.data?.routes?.map((route) => new Route(route)),
			error: handleResponseError(res)
		};
	}
}
