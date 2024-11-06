import { base } from '$app/paths';
import { endSession } from '$lib/store/session';

import type { components } from './headscale.d';
export * from './headscale';
export type * from './headscale.d';

export type RpcStatus = components['schemas']['rpcStatus'];
export type ProtobufAny = components['schemas']['protobufAny'];

export interface ApiErrorCause {
	method?: string;
	path?: string;
}

export class ApiError extends Error implements RpcStatus {
	public readonly code?: number;
	public readonly details?: ProtobufAny[];
	public readonly name: string;
	public readonly message: string;
	public readonly cause?: ApiErrorCause;

	constructor(data: RpcStatus, cause?: ApiErrorCause) {
		const msg = data?.message || 'Internal server error';

		super(msg);

		this.message = msg;
		this.name = 'ApiError';
		this.details = data?.details;
		this.code = data?.code;
		this.cause = cause;

		if (data.code === 401 && typeof data === 'string' && data === 'Unauthorized') {
			endSession();
			window.location.href = base + '/auth';
		}
	}
}

export interface ApiResult {
	error?: RpcStatus;
	response?: {
		url?: string;
	};
}

export function formatApiErrors(errors: (ApiError | undefined)[]): ApiError[] {
	return errors.filter((i) => typeof i !== 'undefined' && i !== null);
}
