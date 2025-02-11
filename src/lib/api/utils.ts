import type { FetchOptions } from 'openapi-fetch';

import type { components } from './gen/headscale';

export type RequestOptions = Omit<FetchOptions<{}>, 'params' | 'body'>;

export type RpcStatus = components['schemas']['rpcStatus'];

export type ApiResponse<data extends any> = Promise<{
	data: data | undefined;
	error: ApiError | undefined;
}>;

export class ApiError extends Error implements RpcStatus {
	public readonly code?: number;
	public readonly details?: components['schemas']['protobufAny'][];
	public readonly name: string;
	public readonly message: string;
	public readonly cause: Response;

	constructor(data: RpcStatus | string | undefined, cause: Response) {
		let message: string;

		if (typeof data === 'object' && typeof data.message === 'string') {
			message = `${data.code}: ${data.message} ${data.details}`;
		} else {
			message = `Internal Error: ${data?.toString() || 'unknown'}`;
		}

		super(message);

		if (typeof data === 'object') {
			this.details = data?.details;
			this.code = data?.code;
		}

		this.message = message;
		this.name = 'ApiError';
		this.cause = cause;
	}
}

export function handleResponseError({
	error,
	response
}: {
	error?: RpcStatus;
	response: Response;
}): ApiError | undefined {
	if (!error) return;
	return new ApiError(error, response);
}
