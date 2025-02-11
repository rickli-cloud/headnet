import { handleResponseError, type ApiResponse, type RequestOptions } from '../utils';
import type { components, operations } from '../gen/headscale';
import type { Headscale } from '../headscale';

export type V1User = components['schemas']['v1User'];

export class User implements V1User {
	public static async list(
		headscale: Headscale,
		opt?: RequestOptions & { data?: { id?: string; name?: string; email?: string } }
	): ApiResponse<User[]> {
		const { data, ...arg } = opt || {};

		const res = await headscale.client.GET('/api/v1/user', {
			...arg,
			params: {
				query: data
			}
		});

		return {
			data: res.data?.users?.map((user) => new User(user)),
			error: handleResponseError(res)
		};
	}

	public static async create(
		headscale: Headscale,
		opt: RequestOptions & {
			data: operations['HeadscaleService_CreateUser']['requestBody']['content']['application/json'];
		}
	): ApiResponse<User> {
		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/user', {
			...arg,
			body: data
		});

		return {
			data: res.data?.user ? new User(res.data.user) : undefined,
			error: handleResponseError(res)
		};
	}

	public readonly name?: string;
	public readonly id?: string;
	public readonly createdAt?: string;

	public constructor(data: V1User) {
		if (!data.name) throw new Error('Name is required to create a new User!');
		Object.assign(this, data);
	}

	public async delete(
		headscale: Headscale,
		opt?: RequestOptions
	): ApiResponse<Record<string, never>> {
		if (!this.id) throw new Error("User's ID is undefined");

		const res = await headscale.client.DELETE('/api/v1/user/{id}', {
			...(opt || {}),
			params: {
				path: {
					id: this.id
				}
			}
		});

		return {
			data: res.data,
			error: handleResponseError(res)
		};
	}

	public async rename(
		headscale: Headscale,
		opt: RequestOptions & { data: { newName: string } }
	): ApiResponse<User> {
		if (!this.id) throw new Error("User's ID is undefined");

		const { data, ...arg } = opt;

		const res = await headscale.client.POST('/api/v1/user/{oldId}/rename/{newName}', {
			...arg,
			params: {
				path: {
					oldId: this.id,
					newName: data.newName
				}
			}
		});

		if (res.data?.user) {
			Object.assign(this, res.data.user);
		}

		return {
			data: this,
			error: handleResponseError(res)
		};
	}
}
