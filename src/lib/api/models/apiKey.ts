import { handleResponseError, type ApiResponse, type RequestOptions } from '../utils';
import type { components } from '../gen/headscale';
import type { Headscale } from '../headscale';

export type V1ApiKey = components['schemas']['v1ApiKey'];

export class ApiKey implements V1ApiKey {
	public static async list(headscale: Headscale, opt?: RequestOptions): ApiResponse<ApiKey[]> {
		const res = await headscale.client.GET('/api/v1/apikey', opt);

		return {
			data: res.data?.apiKeys?.map((key) => new ApiKey(key)),
			error: handleResponseError(res)
		};
	}

	/** Only returns the new API key as string. Reload needed to get it listed */
	public static async create(
		headscale: Headscale,
		opt: RequestOptions & { data: { expiration: string } }
	): ApiResponse<{ apiKey?: string }> {
		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/apikey', {
			...arg,
			body: {
				expiration: data.expiration
			}
		});

		// No data parsing required as it only returns the new API key as string
		return {
			data: res.data,
			error: handleResponseError(res)
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

	public async expire(headscale: Headscale, opt?: RequestOptions): ApiResponse<ApiKey> {
		const res = await headscale.client.POST('/api/v1/apikey/expire', {
			...(opt || {}),
			body: {
				prefix: this.prefix
			}
		});

		Object.assign(this, { expiration: new Date(Date.now()).toISOString() });

		return {
			data: this,
			error: handleResponseError(res)
		};
	}
}
