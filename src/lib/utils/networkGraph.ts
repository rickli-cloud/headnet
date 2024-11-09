import type { ForceGraph3DGenericInstance } from '3d-force-graph';
import { Address4, Address6 } from 'ip-address';

import {
	type Route,
	type Acl,
	groupRegex,
	Machine,
	tagRegex,
	User,
	type V1User,
	type V1Node
} from '$lib/api';

const exitRoutes = ['0.0.0.0/0', '::/0'];

const steppedId = (id: number, level: number = 1) => level * 100000 + id;
export const userGraphId = (id: string | number): number => steppedId(Number(id));
export const machineGraphId = (id: string | number): number => steppedId(Number(id), 2);

export interface GraphDataNodeAttributes {
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
	public color: string;

	constructor(data: V1User) {
		super(data);
		this.nodeId = data.id ? userGraphId(data.id) : 0;
		this.nodeName = String(data.name);
		this.color = 'blue'; // TODO: change to setting
	}
}

export class GraphMachine extends Machine implements GraphDataNodeAttributes {
	public nodeId: number;
	public nodeName: string;
	public color: string;

	constructor(data: V1Node) {
		super(data);
		this.nodeId = data.id ? machineGraphId(data.id) : 0;
		this.nodeName = String(data.givenName || data.name);
		this.color = data.online ? 'green' : 'red'; // TODO: change to setting
	}
}

export interface GraphDataLinkAttributes {
	/** Node ID of source */
	source: number | GraphMachine | GraphUser;
	/** Node ID of target */
	target: number | GraphMachine | GraphUser;
	/** Displayed as text */
	routes: { host: string; port: string; source: string }[];
	/** idk */
	index?: string;
}

export class GraphDataLink implements GraphDataLinkAttributes {
	public source: GraphDataLinkAttributes['source'] = 0;
	public target: GraphDataLinkAttributes['target'] = 0;
	public routes: GraphDataLinkAttributes['routes'] = [];
	public index?: GraphDataLinkAttributes['index'];

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
		nodes.add({
			nodeId: 1,
			nodeName: 'internet',
			color: 'gray'
		});

		// Basic users
		for (const user of data.users || []) {
			nodes.add(new GraphUser(user));
		}

		// Basic machines
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
					links.add({
						source: machineGraphId(machine.id),
						target: 1,
						routes: ([] as GraphDataLink['routes'])
							.concat(
								machine.supportsIpV4
									? [{ host: '0.0.0.0/0', port: '*', source: 'auto:advertised' }]
									: []
							)
							.concat(
								machine.supportsIpV6 ? [{ host: '::/0', port: '*', source: 'auto:advertised' }] : []
							)
					});
				}
			}
		}

		if (data.acl) {
			// Main ACL rules
			for (const rule of data.acl.acls) {
				for (const dst of rule.dst) {
					if (dst.host === `autogroup:internet`) {
						// Exit nodes (autogroup:internet)
						for (const src of rule.src) {
							for (const target of getSrc(src, data, opt)) {
								for (const exitNode of exitNodes) {
									links.add({
										source: target,
										target: machineGraphId(exitNode.id as string),
										routes: ([] as GraphDataLink['routes'])
											.concat(
												exitNode.supportsIpV4
													? [
															{
																host: '0.0.0.0/0',
																port: dst.port,
																source: `${dst.host}:${dst.port}`
															}
														]
													: []
											)
											.concat(
												exitNode.supportsIpV6
													? [{ host: '::/0', port: dst.port, source: `${dst.host}:${dst.port}` }]
													: []
											)
									});
								}
							}
						}
					} else {
						// Basic targets
						const targets = getTarget(dst, data, opt);

						for (const src of rule.src) {
							for (const source of getSrc(src, data, opt)) {
								for (const target of targets) {
									if (target)
										links.add({
											source: source,
											target: target.id,
											routes: target.routes
										});
								}
							}
						}
					}
				}
			}
		}

		return {
			nodes: [...nodes],
			links: formatLinks([...links]),
			exitNodes: [...exitNodes]
		};
	} finally {
		console.timeEnd('formatGraphData');
	}
}

/**
 * - [x] Any (*)
 * - [x] User
 * - [x] Group
 * - [x] Tailscale IP
 * - [x] Hosts
 * - [x] Subnet CIDR
 * - [x] Tag
 */
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

/**
 * - [x] Any (*)
 * - [x] User
 * - [x] Group
 * - [x] Tailscale IP
 * - [x] Hosts
 * - [x] Subnet CIDR
 * - [x] Tag
 * - [x] Autogroup:internet
 */
function getTarget(
	target: { host: string; port: string },
	data: Parameters<typeof formatGraphData>[0],
	opt: FormatGraphDataOptions
): { id: number; routes: GraphDataLinkAttributes['routes'] }[] {
	const result = new Set<{ id: number; routes: GraphDataLinkAttributes['routes'] }>();

	// Any (*)
	if (target.host === '*') {
		for (const machine of data.machines || []) {
			if (machine.id) {
				result.add({
					id: machineGraphId(machine.id),
					routes:
						machine.ipAddresses?.map((ip) => ({
							host: ip,
							port: target.port,
							source: `${target.host}:${target.port}`
						})) || []
					// cidr: machine.ipAddresses?.map((ip) => `${ip}:${target.port}`).join(', ') || ''
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
				for (const subTarget of getTarget({ host: member, port: target.port }, data, opt)) {
					result.add(subTarget);
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
					routes:
						machine.ipAddresses?.map((ip) => ({
							host: ip,
							port: target.port,
							source: `${target.host}:${target.port}`
						})) || []
					// cidr: machine.ipAddresses?.map((ip) => `${ip}:${target.port}`).join(', ') || ''
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
					routes:
						machine.ipAddresses?.map((ip) => ({
							host: ip,
							port: target.port,
							source: `${target.host}:${target.port}`
						})) || []
					// cidr: machine.ipAddresses?.map((ip) => `${ip}:${target.port}`).join(', ') || ''
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
					routes: [{ host: host.cidr, port: target.port, source: `${target.host}:${target.port}` }]
					// cidr: `${host.cidr}:${target.port}`
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

/** Eliminates duplicates and combines cidr */
function formatLinks(links: GraphDataLink[]): GraphDataLink[] {
	const temp: { [x: number]: { [y: number]: Set<GraphDataLinkAttributes['routes'][0]> } } = {};

	for (const link of links) {
		if (
			typeof link.source === 'number' &&
			typeof link.target === 'number' &&
			link.source !== link.target
		) {
			if (typeof temp[link.source] !== 'object') {
				temp[link.source] = {};
			}

			if (temp[link.source][link.target] instanceof Set) {
				for (const route of link.routes) {
					temp[link.source][link.target].add(route);
				}
				// if (temp[link.source][link.target] !== link.cidr) {
				// 	temp[link.source][link.target] = temp[link.source][link.target] + ', ' + link.cidr;
				// }
			} else if (temp[link.target]?.[link.source] instanceof Set) {
				for (const route of link.routes) {
					temp[link.target][link.source].add(route);
				}
				// if (temp[link.target][link.source] !== link.cidr) {
				// 	temp[link.target][link.source] = temp[link.target][link.source] + ', ' + link.cidr;
				// }
			} else {
				temp[link.source][link.target] = new Set();
				for (const route of link.routes) {
					temp[link.source][link.target].add(route);
				}
				// temp[link.source][link.target] = link.cidr;
			}
		}
	}

	const formattedLinks = new Set<GraphDataLink>();

	for (const [source, targets] of Object.entries(temp)) {
		for (const [target, routes] of Object.entries(targets)) {
			formattedLinks.add({ source: Number(source), target: Number(target), routes: [...routes] });
		}
	}

	// console.debug('Removed ' + (links.length - formattedLinks.size) + ' links');

	return [...formattedLinks];
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
