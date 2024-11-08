import { Address4, Address6 } from 'ip-address';

import { type User, type Machine, type Route, type Acl, groupRegex, tagRegex } from '$lib/api';

import type { GraphData, GraphDataLink, GraphDataNode } from '$lib/components/networkGraph';

const exitRoutes = ['0.0.0.0/0', '::/0'];

export interface FormatGraphData {
	users: User[] | undefined;
	machines: Machine[] | undefined;
	routes: Route[] | undefined;
	acl: Acl | undefined;
}

// TODO: change settings to svelte store with persistent storage
let includeDisabledRoutes: boolean = false;

export function formatGraphData(data: FormatGraphData): GraphData {
	try {
		console.time('formatGraphData');

		const nodes = new Set<GraphDataNode>();
		const links = new Set<GraphDataLink>();

		const exitNodes = new Set<number>();

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
						target: machine.nodeId
					});
				}
			}
		}

		// Routes
		for (const route of data.routes || []) {
			// Exit nodes
			if (route.isExit && route.node?.id && (route.enabled || includeDisabledRoutes)) {
				const machine = data.machines?.find((machine) => machine.id === route.node?.id);
				if (machine?.nodeId) {
					exitNodes.add(machine.nodeId);
					links.add({
						source: machine.nodeId,
						target: 1
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
							for (const target of getTargets(data, src)) {
								for (const exitNode of exitNodes) {
									links.add({
										source: target,
										target: exitNode
									});
								}
							}
						}
					} else {
						// Basic targets
						const targets = getTargets(data, dst.host);

						for (const src of rule.src) {
							for (const source of getTargets(data, src)) {
								for (const target of targets) {
									links.add({ source, target });
								}
							}
						}
					}
				}
			}
		}

		return {
			nodes: [...nodes],
			links: [...links]
		};
	} finally {
		console.timeEnd('formatGraphData');
	}
}

/**
 * Get machine ids based on query
 *
 * Query:
 * - [X] Star (*) -> all machines
 * - [X] user name -> machines
 * - [X] group name -> members -> machines
 * - [X] autogroup:internet -> exit nodes
 * - [X] tag -> machines
 * - [X] hosts -> machines
 * - [X] subnet CIDR -> machines
 * - [X] tailnet IP -> machine
 */
function getTargets(data: FormatGraphData, query: string): number[] {
	const ids = new Set<number>();

	// *
	if (query === '*') {
		for (const machine of data.machines || []) {
			if (machine.nodeId) ids.add(machine.nodeId);
		}
		return [...ids]; // Makes no sense to go further as there should be no more matches
	}

	// Groups -> members -> machines
	if (groupRegex.test(query)) {
		const group = data.acl?.groups.find((group) => group.name === query);
		if (group?.members.length) {
			for (const member of group.members) {
				for (const target of getTargets(data, member)) ids.add(target);
			}
		}
		return [...ids]; // Makes no sense to go further as there should be no more matches
	}

	// Tags -> machines
	if (tagRegex.test(query)) {
		const machines =
			data.machines?.filter(
				(machine) => machine.validTags?.includes(query) || machine.forcedTags?.includes(query)
			) || [];
		for (const machine of machines) {
			if (machine.nodeId) ids.add(machine.nodeId);
		}
		return [...ids]; // Makes no sense to go further as there should be no more matches
	}

	// Users -> machines
	const user = data.users?.find((user) => user.name === query);
	if (user) {
		for (const machine of data.machines?.filter((machine) => machine.user?.id === user.id) || []) {
			if (machine.nodeId) ids.add(machine.nodeId);
		}
	}

	// Hosts -> machines
	const host = data.acl?.hosts.find((host) => host.name === query);
	if (host) {
		const addr = parseAddress(host.cidr);
		if (addr) for (const id of getRouteTargets(addr, data.routes)) ids.add(id);
	}

	// CIDR -> machines
	const addr = parseAddress(query);
	if (addr) {
		for (const id of getRouteTargets(addr, data.routes)) ids.add(id);
	}

	// Tailnet IP -> machines
	if (addr) {
		for (const machine of data.machines || []) {
			if (machine.ipAddresses?.includes(addr.address) && typeof machine.nodeId === 'number') {
				ids.add(machine.nodeId);
			}
		}
	}

	return [...ids];
}

function getRouteTargets(addr: Address4 | Address6, routes: Route[] | undefined): number[] {
	const ids = new Set<number>();

	for (const route of routes || []) {
		if (
			route.addr &&
			!exitRoutes.includes(route.addr.address) && // Exclude exit nodes as they are handled separately
			ipVersionMatches(addr, route.addr) &&
			addr.isInSubnet(route.addr) &&
			(route.enabled || includeDisabledRoutes) &&
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
