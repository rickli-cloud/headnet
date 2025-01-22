import { HttpResponse, http, type HttpResponseInit, type PathParams } from 'msw';
import { faker } from '@faker-js/faker';

import { type paths, type RpcStatus } from '$lib/api';

const simulateApiError: boolean = false;

const MAX_ARRAY_LENGTH = 5;
const MIN_ARRAY_LENGTH = 0;

export type ApiMethod = 'get' | 'post' | 'delete' | 'put';
export type ApiPath = keyof paths;
export type ApiOperationRequestBody = NonNullable<ApiOperation['requestBody']>;

export interface ApiOperation {
	requestBody?: {
		content?: {
			'application/json': object;
		};
	};
	responses?: {
		[x: string | number]: object;
	};
}

export type ApiResponse<
	Path extends ApiPath,
	Method extends ApiMethod
> = paths[Path][Method] extends ApiOperation
	? paths[Path][Method]['responses'][200]['content']['application/json']
	: never;

export type ApiRequestBody<
	Path extends ApiPath,
	Method extends ApiMethod
> = paths[Path][Method] extends ApiOperation
	? paths[Path][Method]['requestBody'] extends ApiOperationRequestBody
		? paths[Path][Method]['requestBody']['content']['application/json']
		: never
	: never;

export type HttpRequestData<Path extends ApiPath, Method extends ApiMethod> = Parameters<
	Parameters<typeof http.get<PathParams, ApiRequestBody<Path, Method>>>[1]
>[0];

export function handler<Path extends ApiPath, Method extends ApiMethod>(opt: {
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

export function randomSizedArray<T>(
	handle: (i: number) => T,
	size: number | { min: number; max: number } = { min: MIN_ARRAY_LENGTH, max: MAX_ARRAY_LENGTH }
): T[] {
	return [...new Array(typeof size === 'number' ? size : faker.number.int(size)).keys()].map((i) =>
		handle(i)
	);
}

export function randomString(bytes: number): string {
	return btoa(String.fromCharCode.apply(null, [...crypto.getRandomValues(new Uint8Array(bytes))]));
}
