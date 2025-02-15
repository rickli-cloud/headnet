import { stringify, parse } from 'json-ast-comments';

import {
	ApiError,
	handleResponseError,
	type ApiResponse,
	type RequestOptions
} from '$lib/api/utils';
import { stripJsonTrailingCommas } from '$lib/utils/json';
import type { operations } from '$lib/api/gen/headscale';
import type { Headscale } from '$lib/api/headscale';
import { uuidv4 } from '$lib/utils/misc';

export interface V1Policy {
	/**
	 * groups are collections of users having a common scope. A user can be in multiple groups
	 * groups cannot be composed of groups
	 */
	groups: {
		[x: string]: string[];
	};

	/**
	 * tagOwners in tailscale is an association between a TAG and the people allowed to set this TAG on a server.
	 * This is documented [here](https://tailscale.com/kb/1068/acl-tags#defining-a-tag)
	 * and explained [here](https://tailscale.com/blog/rbac-like-it-was-meant-to-be/)
	 */
	tagOwners: {
		[x: string]: string[];
	};

	/**
	 * hosts should be defined using its IP addresses and a subnet mask.
	 * to define a single host, use a /32 mask. You cannot use DNS entries here,
	 * as they're prone to be hijacked by replacing their IP addresses.
	 * see https://github.com/tailscale/tailscale/issues/3800 for more information.
	 */
	hosts: {
		[x: string]: string;
	};

	/**
	 * Access rules can use groups and tags to grant access to pre-defined sets of users and assign service role accounts to nodes.
	 * Together, groups and tags let you build powerful role-based access control (RBAC) policies.
	 */
	acls: {
		/** "accept" */
		action: string;
		proto?: string;
		src: string[];
		dst: string[];
		/** INTERNAL */
		id?: string;
	}[];

	/**
	 * Some actions in Headscale require double opt-in.
	 * For example advertising a set of routes or advertising as exit node requires an approval by an administrator.
	 */
	autoApprovers: {
		routes: {
			[x: string]: string[];
		};
		exitNode: string[];
	};

	/**
	 * The ssh section of the tailnet policy file defines lists of users and devices that can use Tailscale SSH (and the SSH users).
	 * To allow a connection, the tailnet policy file must contain rules permitting both network access and SSH access.
	 */
	ssh: {
		/** "accept" or "check" */
		action: string;
		src: string[];
		dst: string[];
		/** list of ssh users (not headscale) */
		users: string[];
		/** optional, only for check actions. default 12h */
		checkPeriod?: string;
		/** optional, allowlists environment variables that can be forwarded from clients to the host */
		acceptEnv?: string[];
	};
}

export type V1GetPolicyResponse =
	operations['HeadscaleService_GetPolicy']['responses']['200']['content']['application/json'];

export interface JsonComments {
	[x: string]: string[][];
}
export type CommentObj = {
	$$comments: JsonComments;
};
export interface V1PolicyComments {
	groups: CommentObj;
	tagOwners: CommentObj;
	hosts: CommentObj;
	/** Acls */
	$$comments: { $acls: { [x: number]: string[][] } };
	/* TODO: autoApprovers */
	/* TODO: ssh */
}

export class Policy implements V1GetPolicyResponse, Partial<V1Policy> {
	protected parse(policy: string): Partial<V1Policy> {
		const parsed = parse(stripJsonTrailingCommas(policy));

		for (let i = 0; i < parsed.acls.length; i++) {
			parsed.acls[i] = { ...parsed.acls[i], id: i };
		}
		// parsed.acls = parsed?.acls?.map((acl: object) => ({ id: uuidv4(), ...acl }));

		return parsed;
	}

	public static async load(
		headscale: Headscale,
		opt?: RequestOptions
	): Promise<{ data: Policy; error?: ApiError }> {
		const res = await headscale.client.GET('/api/v1/policy', opt);

		return {
			data: new Policy(res.data),
			error: handleResponseError(res)
		};
	}

	/** Do not make changes here as they wont be saved! */
	public readonly policy?: string | undefined;
	public readonly updatedAt?: string | undefined;

	public groups: V1Policy['groups'] | undefined;
	public tagOwners: V1Policy['tagOwners'] | undefined;
	public hosts: V1Policy['hosts'] | undefined;
	public acls: V1Policy['acls'] | undefined;
	public autoApprovers: V1Policy['autoApprovers'] | undefined;
	public ssh: V1Policy['ssh'] | undefined;

	public get comments(): V1PolicyComments {
		const comments = this as unknown as V1PolicyComments;

		return {
			groups: { $$comments: comments?.groups?.$$comments || {} },
			tagOwners: { $$comments: comments?.tagOwners?.$$comments || {} },
			hosts: { $$comments: comments?.hosts?.$$comments || {} },
			$$comments: comments?.$$comments || {}
		};
	}

	constructor(data: V1GetPolicyResponse | undefined) {
		if (data?.policy) {
			Object.assign(this, data);
			Object.assign(this, this.parse(data.policy));
		} else {
			Object.assign(this, {
				policy: '{}',
				updatedAt: new Date(Date.now()).toISOString()
			});
		}
	}

	public async save(
		headscale: Headscale,
		opt?: RequestOptions & { data?: { policy?: string } }
	): ApiResponse<Policy> {
		const { data, ...arg } = opt || {};

		const res = await headscale.client.PUT('/api/v1/policy', {
			...arg,
			body: {
				policy: data?.policy ?? this.stringify()
			}
		});

		if (res.data?.policy) {
			Object.assign(this, res.data);
			Object.assign(this, this.parse(res.data.policy));
		}

		return {
			data: this,
			error: handleResponseError(res)
		};
	}

	public stringify() {
		const newPolicy: Partial<V1Policy> = {
			groups: this.groups,
			tagOwners: this.tagOwners,
			hosts: this.hosts,
			acls: this.acls,
			autoApprovers: this.autoApprovers,
			ssh: this.ssh
		};

		Object.assign(newPolicy, this.comments);

		for (const key of Object.keys(newPolicy)) {
			if (typeof newPolicy[key as keyof Partial<V1Policy>] === 'undefined') {
				delete newPolicy[key as keyof Partial<V1Policy>];
			}
		}

		return stringify(newPolicy);
	}
}
