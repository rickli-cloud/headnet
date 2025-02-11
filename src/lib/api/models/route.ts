import { Address4, Address6 } from 'ip-address';

import { handleResponseError, type ApiResponse, type RequestOptions } from '../utils';
import type { components } from '../gen/headscale';
import type { Headscale } from '../headscale';

import { Node } from './node';

export type V1Route = components['schemas']['v1Route'];

export class Route implements V1Route {
	public static async list(headscale: Headscale, opt?: RequestOptions): ApiResponse<Route[]> {
		const res = await headscale.client.GET('/api/v1/routes', opt);

		return {
			data: res.data?.routes?.map((route) => new Route(route)),
			error: handleResponseError(res)
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
	public readonly node?: Node;

	public readonly addr?: Address4 | Address6;

	public get isExit(): boolean {
		return (this.prefix && ['0.0.0.0/0', '::/0'].includes(this.prefix)) || false;
	}

	public constructor(data: V1Route) {
		Object.assign(this, data);

		if (data.node) this.node = new Node(data.node);

		if (data.prefix) {
			this.addr = Address4.isValid(data.prefix)
				? new Address4(data.prefix)
				: Address6.isValid(data.prefix)
					? new Address6(data.prefix)
					: undefined;
		}
	}

	public async delete(
		headscale: Headscale,
		opt?: RequestOptions
	): ApiResponse<Record<string, never>> {
		if (!this.id) throw new Error('Cannot create route without id.');

		const res = await headscale.client.DELETE('/api/v1/routes/{routeId}', {
			...(opt || {}),
			params: {
				path: {
					routeId: this.id
				}
			}
		});

		return {
			data: res.data,
			error: handleResponseError(res)
		};
	}

	public async disable(headscale: Headscale, opt?: RequestOptions): ApiResponse<Route> {
		if (!this.id) throw new Error('Cannot disable route without id.');

		const res = await headscale.client.POST('/api/v1/routes/{routeId}/disable', {
			...(opt || {}),
			params: {
				path: {
					routeId: this.id
				}
			}
		});

		Object.assign(this, { enabled: false });

		return {
			data: this,
			error: handleResponseError(res)
		};
	}

	public async enable(headscale: Headscale, opt?: RequestOptions): ApiResponse<Route> {
		if (!this.id) throw new Error('Cannot enable route without id.');

		const res = await headscale.client.POST('/api/v1/routes/{routeId}/enable', {
			...(opt || {}),
			params: {
				path: {
					routeId: this.id
				}
			}
		});

		Object.assign(this, { enabled: true });

		return {
			data: this,
			error: handleResponseError(res)
		};
	}
}
