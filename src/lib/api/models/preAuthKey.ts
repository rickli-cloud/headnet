import { handleResponseError, type ApiResponse, type RequestOptions } from '../utils';
import type { components } from '../gen/headscale';
import type { Headscale } from '../headscale';

export type V1PreAuthKey = components['schemas']['v1PreAuthKey'];

export class PreAuthKey implements V1PreAuthKey {
	public static async find(
		headscale: Headscale,
		opt: RequestOptions & { data: { user: string } }
	): ApiResponse<PreAuthKey[]> {
		const { data, ...arg } = opt;

		const res = await headscale.client.GET('/api/v1/preauthkey', {
			...arg,
			params: {
				query: {
					user: data.user
				}
			}
		});

		return {
			data: res.data?.preAuthKeys?.map((key) => new PreAuthKey(key)),
			error: handleResponseError(res)
		};
	}

	public static async create(
		headscale: Headscale,
		opt: RequestOptions & {
			data: {
				user: string;
				expiration: string;
				aclTags: string[];
				ephemeral: boolean;
				reusable: boolean;
			};
		}
	): ApiResponse<PreAuthKey> {
		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/preauthkey', {
			...arg,
			body: {
				user: data.user,
				expiration: data.expiration,
				aclTags: data.aclTags,
				ephemeral: data.ephemeral,
				reusable: data.reusable
			}
		});

		return {
			data: res.data?.preAuthKey ? new PreAuthKey(res.data.preAuthKey) : undefined,
			error: handleResponseError(res)
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

	public async expire(
		headscale: Headscale,
		opt?: RequestOptions
	): ApiResponse<Record<string, never>> {
		const res = await headscale.client.POST('/api/v1/preauthkey/expire', {
			...(opt || {}),
			body: {
				key: this.key,
				user: this.user
			}
		});

		return {
			data: res.data,
			error: handleResponseError(res)
		};
	}
}
