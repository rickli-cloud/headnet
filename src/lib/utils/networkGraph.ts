import { Address4, Address6 } from 'ip-address';

import { type User, type Machine, type Route, type Acl, groupRegex, tagRegex } from '$lib/api';

import type { GraphData, GraphDataLink, GraphDataNode } from '$lib/components/networkGraph';
import type { ForceGraph3DGenericInstance } from '3d-force-graph';

const exitRoutes = ['0.0.0.0/0', '::/0'];

export interface FormatGraphData {
	users: User[] | undefined;
	machines: Machine[] | undefined;
	routes: Route[] | undefined;
	acl: Acl | undefined;
}

export interface FormatGraphDataOptions {
	includeDisabledRoutes?: boolean;
}

export interface FormatGraphDataResult extends GraphData {
	exitNodes: Machine[];
}

export function formatGraphData(
	data: FormatGraphData,
	opt: FormatGraphDataOptions = {}
): FormatGraphDataResult {
	try {
		console.time('formatGraphData');

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
		for (const user of data.users || []) nodes.add(user);

		// Basic machines
		for (const machine of data.machines || []) {
			nodes.add(machine);

			// Link users to machine
			if (machine.user?.id) {
				const user = data.users?.find((user) => user.id === machine.user?.id);

				if (user?.nodeId) {
					links.add({
						source: user.nodeId,
						target: machine.nodeId,
						cidr: ''
					});
				}
			}
		}

		// Routes
		for (const route of data.routes || []) {
			// Exit nodes -> internet
			if (route.isExit && route.node?.id && (route.enabled || opt.includeDisabledRoutes)) {
				const machine = data.machines?.find((machine) => machine.id === route.node?.id);
				if (machine?.nodeId) {
					exitNodes.add(machine);
					links.add({
						source: machine.nodeId,
						target: 1,
						cidr:
							machine.supportsIpV4 && machine.supportsIpV6
								? '0.0.0.0/0, ::/0'
								: machine.supportsIpV4
									? '0.0.0.0/0'
									: machine.supportsIpV6
										? '::/0'
										: ''
					});
				}
			}
		}

		if (data.acl) {
			// Main ACL rules
			for (const rule of data.acl.acls) {
				for (const dst of rule.dst) {
					if (dst.host === 'autogroup:internet') {
						// Exit nodes (autogroup:internet)
						for (const src of rule.src) {
							for (const target of getSrc(src, data, opt)) {
								for (const exitNode of exitNodes) {
									links.add({
										source: target,
										target: exitNode,
										cidr:
											exitNode.supportsIpV4 && exitNode.supportsIpV6
												? '0.0.0.0/0, ::/0'
												: exitNode.supportsIpV4
													? '0.0.0.0/0'
													: exitNode.supportsIpV6
														? '::/0'
														: ''
									});
								}
							}
						}
					} else {
						// Basic targets
						const targets = getTarget(dst.host, data, opt);

						for (const src of rule.src) {
							for (const source of getSrc(src, data, opt)) {
								for (const target of targets) {
									if (target) links.add({ source: source, target: target.id, cidr: target.cidr });
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
function getSrc(src: string, data: FormatGraphData, opt: FormatGraphDataOptions): number[] {
	const ids = new Set<number>();

	// Any (*)
	if (src === '*') {
		for (const machine of data.machines || []) {
			if (machine.nodeId) ids.add(machine.nodeId);
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
			if (machine.nodeId) ids.add(machine.nodeId);
		}
		return [...ids]; // Makes no sense to go further as there should be no more matches
	}

	// Users
	const user = data.users?.find((user) => user.name === src);
	if (user) {
		for (const machine of data.machines?.filter((machine) => machine.user?.id === user.id) || []) {
			if (machine.nodeId) ids.add(machine.nodeId);
		}
	}

	// Hosts
	// const host = data.acl?.hosts.find((host) => host.name === src);
	// if (host) {
	// 	const addr = parseAddress(host.cidr);
	// 	if (addr) for (const id of getRouteTargets(addr, data.routes, opt)) ids.add(id);
	// }

	// CIDR
	const addr = parseAddress(src);
	if (addr) {
		for (const id of getRouteTargets(addr, data.routes, opt)) ids.add(id);
	}

	// Tailnet IP
	if (addr) {
		for (const machine of data.machines || []) {
			if (machine.ipAddresses?.includes(addr.address) && typeof machine.nodeId === 'number') {
				ids.add(machine.nodeId);
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
	target: string,
	data: FormatGraphData,
	opt: FormatGraphDataOptions
): { id: number; cidr: string }[] {
	const result = new Set<{ id: number; cidr: string }>();

	// Any (*)
	if (target === '*') {
		for (const machine of data.machines || []) {
			if (machine.nodeId) {
				result.add({
					id: machine.nodeId,
					cidr: machine.ipAddresses?.join(', ') || ''
				});
			}
		}
		return [...result]; // Makes no sense to go further as there should be no more matches
	}

	// Groups
	if (groupRegex.test(target)) {
		const group = data.acl?.groups.find((group) => group.name === target);
		if (group?.members.length) {
			for (const member of group.members) {
				for (const target of getTarget(member, data, opt)) {
					result.add(target);
				}
			}
		}
		return [...result]; // Makes no sense to go further as there should be no more matches
	}

	// Tags
	if (tagRegex.test(target)) {
		const machines =
			data.machines?.filter(
				(machine) => machine.validTags?.includes(target) || machine.forcedTags?.includes(target)
			) || [];
		for (const machine of machines) {
			if (machine.nodeId) {
				result.add({
					id: machine.nodeId,
					cidr: machine.ipAddresses?.join(', ') || ''
				});
			}
		}
		return [...result]; // Makes no sense to go further as there should be no more matches
	}

	// Users
	const user = data.users?.find((user) => user.name === target);
	if (user) {
		for (const machine of data.machines?.filter((machine) => machine.user?.id === user.id) || []) {
			if (machine.nodeId) {
				result.add({
					id: machine.nodeId,
					cidr: machine.ipAddresses?.join(', ') || ''
				});
			}
		}
	}

	// Hosts -> machines
	const host = data.acl?.hosts.find((host) => host.name === target);
	if (host) {
		const addr = parseAddress(host.cidr);
		if (addr)
			for (const id of getRouteTargets(addr, data.routes, opt)) {
				result.add({
					id,
					cidr: host.cidr
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
			route.node?.nodeId
		) {
			ids.add(route.node.nodeId);
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

function formatLinks(links: GraphDataLink[]): GraphDataLink[] {
	const temp: { [x: number]: { [y: number]: string } } = {};

	for (const link of links) {
		if (
			typeof link.source === 'number' &&
			typeof link.target === 'number' &&
			link.source !== link.target
		) {
			if (typeof temp[link.source] !== 'object') {
				temp[link.source] = {};
			}

			if (typeof temp[link.source][link.target] === 'string') {
				if (temp[link.source][link.target] !== link.cidr) {
					temp[link.source][link.target] = temp[link.source][link.target] + ', ' + link.cidr;
				}
			} else if (typeof temp[link.target]?.[link.source] === 'string') {
				if (temp[link.target][link.source] !== link.cidr) {
					temp[link.target][link.source] = temp[link.target][link.source] + ', ' + link.cidr;
				}
			} else {
				temp[link.source][link.target] = link.cidr;
			}
		}
	}

	const formattedLinks = new Set<GraphDataLink>();

	for (const [source, targets] of Object.entries(temp)) {
		for (const [target, cidr] of Object.entries(targets)) {
			formattedLinks.add({ source: Number(source), target: Number(target), cidr });
		}
	}

	return [...formattedLinks];
}

export function focusOnNode(graph: ForceGraph3DGenericInstance<any>, node: unknown) {
	const coords = node as { x: number; y: number; z: number };
	// Aim at node from outside it
	const distance = 100;
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
