/*
 * Implemented rule targets:
 *
 * - [x] Any (*)
 * - [x] User
 * - [x] Group
 * - [x] Tailscale IP
 * - [x] Hosts
 * - [x] Subnet CIDR
 * - [x] Tag
 * - [x] Autogroup:internet
 */

import type { ForceGraph3DGenericInstance, ForceGraph3DInstance } from '3d-force-graph';
import { Address4, Address6 } from 'ip-address';

import {
	groupRegex,
	Machine,
	tagRegex,
	User,
	type Route,
	type Acl,
	type V1User,
	type V1Node
} from '$lib/api';

const exitRoutes = ['0.0.0.0/0', '::/0'];

type AclRule = Acl['acls'][0];

// ID's:
// 1 Internet
// 100000 - 199999 	users
// 200000 - 299999 	machines
const steppedId = (id: number, level: number = 1) => level * 100000 + id;
export const userGraphId = (id: string | number): number => steppedId(Number(id));
export const machineGraphId = (id: string | number): number => steppedId(Number(id), 2);

type BaseGraphData = Parameters<ForceGraph3DGenericInstance<any>['graphData']>[0]['nodes'][0];

export interface GraphDataNodeAttributes extends BaseGraphData {
	/** Node ID inside of network graph */
	nodeId?: number;
	/** Node name inside of network graph */
	nodeName?: string;
	/** Color of network graph node */
	color: string;
}

export class GraphUser extends User implements GraphDataNodeAttributes {
	public nodeId: number;
	public nodeName: string;
	public color: string = '#696969';
	index?: number | undefined;
	x?: number | undefined;
	y?: number | undefined;
	z?: number | undefined;
	vx?: number | undefined;
	vy?: number | undefined;
	vz?: number | undefined;
	fx?: number | undefined;
	fy?: number | undefined;
	fz?: number | undefined;

	constructor(data: V1User) {
		super(data);
		this.nodeId = data.id ? userGraphId(data.id) : 0;
		this.nodeName = String(data.name);
	}
}

export class GraphMachine extends Machine implements GraphDataNodeAttributes {
	public nodeId: number;
	public nodeName: string;
	public color: string = ''; // auto color
	index?: number | undefined;
	x?: number | undefined;
	y?: number | undefined;
	z?: number | undefined;
	vx?: number | undefined;
	vy?: number | undefined;
	vz?: number | undefined;
	fx?: number | undefined;
	fy?: number | undefined;
	fz?: number | undefined;

	constructor(data: V1Node) {
		super(data);
		this.nodeId = data.id ? machineGraphId(data.id) : 0;
		this.nodeName = String(data.givenName || data.name);
	}
}

export class GraphInternet implements GraphDataNodeAttributes {
	public readonly nodeId = 1;
	public readonly nodeName = 'Internet';
	public color = '#ef3340';
	// get color(): string { return get(mode) === 'dark' ? '#EFEFEF' : '#101010'; }

	constructor(data?: { color?: string }) {
		if (data) Object.assign(this, data);
	}
}

export type LinkNode = number | GraphMachine | GraphUser;

export function isLinkNode(node: LinkNode, nodeId: number): boolean {
	return (
		(typeof node === 'number' && node === nodeId) ||
		((node instanceof GraphMachine || node instanceof GraphUser) && node.nodeId === nodeId) ||
		false
	);
}

export interface GraphDataLinkAttributes {
	/** Source node */
	source: LinkNode;
	/** Target node */
	target: LinkNode;
	/** Displayed as text */
	routes: { host: string; port: string; rule: AclRule | undefined }[];
	/** idk */
	index?: string;
}

export class GraphDataLink implements GraphDataLinkAttributes {
	public source: GraphDataLinkAttributes['source'] = 0;
	public target: GraphDataLinkAttributes['target'] = 0;
	public routes: GraphDataLinkAttributes['routes'] = [];
	public index?: GraphDataLinkAttributes['index'];

	get name(): string {
		return this.routes.map((route) => `${route.host}:${route.port}`).join(', ');
	}

	constructor(data: GraphDataLinkAttributes) {
		Object.assign(this, data);
	}
}

export type GraphDataNode = GraphUser | GraphMachine | GraphDataNodeAttributes;

export interface GraphData {
	nodes: GraphDataNode[];
	links: GraphDataLink[];
}

export interface FormatGraphDataOptions {
	includeDisabledRoutes?: boolean;
}

export interface FormatGraphDataResult extends GraphData {
	exitNodes: Machine[];
}

export function formatGraphData(
	data: {
		users: User[] | undefined;
		machines: Machine[] | undefined;
		routes: Route[] | undefined;
		acl: Acl | undefined;
	},
	opt: FormatGraphDataOptions = {}
): FormatGraphDataResult {
	console.time('formatGraphData');

	try {
		const nodes = new Set<GraphDataNode>();
		const links = new Set<GraphDataLink>();
		const exitNodes = new Set<Machine>();

		// Internet node (Exit nodes link to it)
		nodes.add(new GraphInternet());

		// Basic user nodes
		for (const user of data.users || []) {
			nodes.add(new GraphUser(user));
		}

		// Basic machine nodes
		for (const machine of data.machines || []) {
			nodes.add(new GraphMachine(machine));

			// Link users to machine
			if (machine.user?.id) {
				const user = data.users?.find((user) => user.id === machine.user?.id);

				if (user?.id && machine.id) {
					links.add(
						new GraphDataLink({
							source: userGraphId(user.id),
							target: machineGraphId(machine.id),
							routes: []
						})
					);
				}
			}
		}

		// Routes
		for (const route of data.routes || []) {
			// Exit nodes -> internet
			if (route.isExit && route.node?.id && (route.enabled || opt.includeDisabledRoutes)) {
				const machine = data.machines?.find((machine) => machine.id === route.node?.id);
				if (machine?.id) {
					exitNodes.add(machine);
					links.add(
						new GraphDataLink({
							source: machineGraphId(machine.id),
							target: 1,
							routes: [{ host: route.addr?.address || '', port: '*', rule: undefined }]
						})
					);
				}
			}
		}

		if (data.acl) {
			// Main ACL rules
			for (const rule of data.acl.acls) {
				for (const dst of rule.dst || []) {
					if (dst.host === `autogroup:internet`) {
						// Exit nodes (autogroup:internet)
						for (const src of rule.src) {
							for (const target of getSrc(src, data, opt)) {
								for (const exitNode of exitNodes) {
									links.add(
										new GraphDataLink({
											source: target,
											target: machineGraphId(exitNode.id as string),
											routes: ([] as GraphDataLink['routes'])
												.concat(
													exitNode.supportsIpV4 ? [{ host: '0.0.0.0/0', port: dst.port, rule }] : []
												)
												.concat(
													exitNode.supportsIpV6 ? [{ host: '::/0', port: dst.port, rule }] : []
												)
										})
									);
								}
							}
						}
					} else {
						// Basic targets
						const targets = getTarget(dst, data, rule, opt);

						for (const src of rule.src) {
							for (const source of getSrc(src, data, opt)) {
								for (const target of targets) {
									if (target)
										links.add(
											new GraphDataLink({
												source: source,
												target: target.id,
												routes: target.routes.map((route) => ({ ...route, rule }))
											})
										);
								}
							}
						}
					}
				}
			}
		}

		return {
			nodes: [...nodes],
			links: formatLinks([...links], data.acl?.acls),
			exitNodes: [...exitNodes]
		};
	} finally {
		console.timeEnd('formatGraphData');
	}
}

function getSrc(
	src: string,
	data: Parameters<typeof formatGraphData>[0],
	opt: FormatGraphDataOptions
): number[] {
	const ids = new Set<number>();

	// Any (*)
	if (src === '*') {
		for (const machine of data.machines || []) {
			if (machine.id) ids.add(machineGraphId(machine.id));
		}
		return [...ids]; // Makes no sense to go further as there should be no more matches
	}

	// Groups
	if (groupRegex.test(src)) {
		const group = data.acl?.groups.find((group) => group.name === src);
		if (group?.members.length) {
			for (const member of group.members) {
				for (const target of getSrc(member, data, opt)) ids.add(target);
			}
		}
		return [...ids]; // Makes no sense to go further as there should be no more matches
	}

	// Tags
	if (tagRegex.test(src)) {
		const machines =
			data.machines?.filter(
				(machine) => machine.validTags?.includes(src) || machine.forcedTags?.includes(src)
			) || [];
		for (const machine of machines) {
			if (machine.id) ids.add(machineGraphId(machine.id));
		}
		return [...ids]; // Makes no sense to go further as there should be no more matches
	}

	// Users
	const user = data.users?.find((user) => user.name === src);
	if (user) {
		for (const machine of data.machines?.filter((machine) => machine.user?.id === user.id) || []) {
			if (machine.id) ids.add(machineGraphId(machine.id));
		}
	}

	// Hosts
	const host = data.acl?.hosts.find((host) => host.name === src);
	if (host) {
		const addr = parseAddress(host.cidr);
		if (addr) for (const id of getRouteTargets(addr, data.routes, opt)) ids.add(id);
	}

	// CIDR
	const addr = parseAddress(src);
	if (addr) {
		for (const id of getRouteTargets(addr, data.routes, opt)) ids.add(id);
	}

	// Tailnet IP
	if (addr) {
		for (const machine of data.machines || []) {
			if (machine.ipAddresses?.includes(addr.address) && machine.id) {
				ids.add(machineGraphId(machine.id));
			}
		}
	}

	return [...ids];
}

function getTarget(
	target: { host: string; port: string },
	data: Parameters<typeof formatGraphData>[0],
	rule: AclRule,
	opt: FormatGraphDataOptions
): { id: number; routes: GraphDataLinkAttributes['routes'] }[] {
	const result = new Set<{ id: number; routes: GraphDataLinkAttributes['routes'] }>();

	// Any (*)
	if (target.host === '*') {
		for (const machine of data.machines || []) {
			if (machine.id) {
				result.add({
					id: machineGraphId(machine.id),
					routes: machine.ipAddresses?.map((ip) => ({ host: ip, port: target.port, rule })) || []
				});
			}
		}
		return [...result]; // Makes no sense to go further as there should be no more matches
	}

	// Groups
	if (groupRegex.test(target.host)) {
		const group = data.acl?.groups.find((group) => group.name === target.host);
		if (group?.members.length) {
			for (const member of group.members) {
				for (const subTarget of getTarget({ host: member, port: target.port }, data, rule, opt)) {
					result.add({
						...subTarget,
						routes: subTarget.routes // .map((route) => ({ ...route, source: `${target.host}:${target.port}` }))
					});
				}
			}
		}
		return [...result]; // Makes no sense to go further as there should be no more matches
	}

	// Tags
	if (tagRegex.test(target.host)) {
		const machines =
			data.machines?.filter(
				(machine) =>
					machine.validTags?.includes(target.host) || machine.forcedTags?.includes(target.host)
			) || [];
		for (const machine of machines) {
			if (machine.id) {
				result.add({
					id: machineGraphId(machine.id),
					routes: machine.ipAddresses?.map((ip) => ({ host: ip, port: target.port, rule })) || []
				});
			}
		}
		return [...result]; // Makes no sense to go further as there should be no more matches
	}

	// Users
	const user = data.users?.find((user) => user.name === target.host);
	if (user) {
		for (const machine of data.machines?.filter((machine) => machine.user?.id === user.id) || []) {
			if (machine.id) {
				result.add({
					id: machineGraphId(machine.id),
					routes: machine.ipAddresses?.map((ip) => ({ host: ip, port: target.port, rule })) || []
				});
			}
		}
	}

	// Hosts
	const host = data.acl?.hosts.find((host) => host.name === target.host);
	if (host) {
		const addr = parseAddress(host.cidr);
		if (addr)
			for (const id of getRouteTargets(addr, data.routes, opt)) {
				result.add({
					id,
					routes: [{ host: host.cidr, port: target.port, rule }]
				});
			}
	}

	return [...result];
}

function getRouteTargets(
	addr: Address4 | Address6,
	routes: Route[] | undefined,
	opt: FormatGraphDataOptions
): number[] {
	const ids = new Set<number>();

	for (const route of routes || []) {
		if (
			route.addr &&
			!exitRoutes.includes(route.addr.address) && // Exclude exit nodes as they are handled separately
			ipVersionMatches(addr, route.addr) &&
			addr.isInSubnet(route.addr) &&
			(route.enabled || opt.includeDisabledRoutes) &&
			route.node?.id
		) {
			ids.add(machineGraphId(route.node.id));
		}
	}

	return [...ids];
}

function ipVersionMatches(addr1: Address4 | Address6, addr2: Address4 | Address6): boolean {
	if (addr1 instanceof Address4 && addr2 instanceof Address4) return true;
	if (addr1 instanceof Address6 && addr2 instanceof Address6) return true;
	return false;
}

function parseAddress(addr: string): Address4 | Address6 | undefined {
	return Address4.isValid(addr)
		? new Address4(addr)
		: Address6.isValid(addr)
			? new Address6(addr)
			: undefined;
}

/** Eliminates duplicates & ensures only one link gets a label to prevent overlap */
function formatLinks(links: GraphDataLink[], acls: Acl['acls'] | undefined): GraphDataLink[] {
	const aclRules = Object.fromEntries(acls?.map((acl) => [acl.id, acl]) || []);
	const temp: {
		[sourceId: number]: {
			[targetId: number]: {
				[ruleId: string]: {
					host: string;
					port: string;
				}[];
			};
		};
	} = {};

	for (const link of links) {
		if (
			(typeof link.source === 'number' || typeof link.source === 'string') &&
			(typeof link.target === 'number' || typeof link.target === 'string') &&
			link.source !== link.target
		) {
			if (typeof temp[Number(link.source)] !== 'object') {
				temp[Number(link.source)] = {};
			}
			if (typeof temp[Number(link.source)][Number(link.target)] !== 'object') {
				temp[Number(link.source)][Number(link.target)] = {};
			}
			for (const route of link.routes) {
				if (route.rule) {
					if (!Array.isArray(temp[Number(link.source)][Number(link.target)][route.rule?.id])) {
						temp[Number(link.source)][Number(link.target)][route.rule?.id] = [];
					}
					temp[Number(link.source)][Number(link.target)][route.rule?.id].push({
						host: route.host,
						port: route.port
					});
				}
			}
		}
	}

	const formatted = new Set<GraphDataLink>();

	for (const [sourceId, targets] of Object.entries(temp)) {
		for (const [targetId, rules] of Object.entries(targets)) {
			const routes: GraphDataLinkAttributes['routes'] = [];

			for (const [ruleId, ruleRoutes] of Object.entries(rules)) {
				routes.push(...ruleRoutes.map((route) => ({ ...route, rule: aclRules[ruleId] })));
			}

			formatted.add(
				new GraphDataLink({
					source: Number(sourceId),
					target: Number(targetId),
					routes
				})
			);
		}
	}

	return [...formatted];
}

export function focusOnNode(
	graph: ForceGraph3DGenericInstance<any>,
	node: unknown,
	distance: number = 200
) {
	const coords = node as { x: number; y: number; z: number };
	const distRatio = 1 + distance / Math.hypot(coords.x, coords.y, coords.z);

	const newPos =
		coords.x || coords.y || coords.z
			? { x: coords.x * distRatio, y: coords.y * distRatio, z: coords.z * distRatio }
			: { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

	graph.cameraPosition(
		newPos, // new position
		coords, // lookAt ({ x, y, z })
		3000 // ms transition duration
	);
}
