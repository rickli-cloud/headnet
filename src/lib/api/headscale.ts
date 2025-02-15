import createClient, { type Client, type ClientOptions } from 'openapi-fetch';

import * as HeadscaleTypes from './gen/headscale';

import { ApiKey } from './models/apiKey';
import { Node } from './models/node';
import { Policy } from './models/policy';
import { PreAuthKey } from './models/preAuthKey';
import { Route } from './models/route';
import { User } from './models/user';
import { ApiError } from './utils';

export interface HeadscaleConstructorParameters extends ClientOptions {}

export class Headscale<paths extends object = HeadscaleTypes.paths> {
	/** Current Headscale version */
	public readonly version = HeadscaleTypes.version;

	/**
	 * OpenAPI fetch client
	 * @see https://openapi-ts.dev/openapi-fetch
	 */
	public readonly client: Client<paths, `${string}/${string}`>;

	public readonly ApiError = ApiError;
	public readonly ApiKey = ApiKey;
	public readonly Node = Node;
	public readonly Policy = Policy;
	public readonly PreAuthKey = PreAuthKey;
	public readonly Route = Route;
	public readonly User = User;

	constructor(opt: HeadscaleConstructorParameters = {}) {
		const { ...params } = opt;

		this.client = createClient<paths, `${string}/${string}`>(params);
	}
}
