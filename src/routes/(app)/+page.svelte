<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { stringify } from 'yaml';

	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';
	import UserRoundPen from 'lucide-svelte/icons/user-round-pen';
	import Sliders from 'lucide-svelte/icons/sliders-horizontal';
	import MonitorCog from 'lucide-svelte/icons/monitor-cog';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import ShieldOff from 'lucide-svelte/icons/shield-off';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Network from 'lucide-svelte/icons/network';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Braces from 'lucide-svelte/icons/braces';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Cog from 'lucide-svelte/icons/cog';
	import X from 'lucide-svelte/icons/x';

	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import PreAuthKeyList from '$lib/components/data/preAuthKey/PreAuthKeyList.svelte';
	import MachineStatus from '$lib/components/data/machine/MachineStatus.svelte';
	import MachineInfo from '$lib/components/data/machine/MachineInfo.svelte';
	import GroupList from '$lib/components/data/group/GroupList.svelte';

	import { NetworkGraph, type GraphData } from '$lib/components/networkGraph';

	import { groupRegex, Machine, PreAuthKey, tagRegex, User } from '$lib/api/headscale.js';
	import { base } from '$app/paths';
	import { formatDuration, isExpired, neverExpires } from '$lib/utils/time.js';
	import MachineRoutes from '$lib/components/data/machine/MachineRoutes.svelte';

	export let data;

	const graphData: GraphData = {
		nodes: [],
		links: []
	};

	const preAuthKeys = writable<PreAuthKey[]>([]);

	preAuthKeys.subscribe(console.debug);

	const exitNodes: {
		nodeId: number;
		v4: boolean;
		v6: boolean;
	}[] = [];

	// Internet node (Exit nodes link to it)
	graphData.nodes.push({
		nodeId: 1,
		nodeName: 'internet',
		color: 'gray'
	});

	// Basic users
	if (data.users) {
		for (const user of data.users) graphData.nodes.push(user);
	}

	// Basic machines
	if (data.machines) {
		for (const machine of data.machines) {
			graphData.nodes.push(machine);

			// Link users to machine
			if (machine.user?.id) {
				const user = data.users?.find((user) => user.id === machine.user?.id);

				if (user?.nodeId) {
					graphData.links.push({
						source: user?.nodeId,
						target: machine.nodeId
					});
				}
			}

			// Determine exit node
			const exitNode = machine.isExitNode(data.routes);

			if (machine.nodeId && (exitNode.v4 || exitNode.v6)) {
				exitNodes.push({
					nodeId: machine.nodeId,
					...exitNode
				});
				graphData.links.push({
					source: machine.nodeId,
					target: 1
				});
			}
		}
	}

	if (data.acl) {
		/**
		 * Get machine ids based on query
		 *
		 * Query:
		 * - [X] Star (*) -> all machines
		 * - [X] user name -> machines
		 * - [X] group name -> members -> machines
		 * - [X] autogroup:internet -> exit nodes
		 * - [X] tag -> machines
		 * - [ ] tailnet IP -> machine
		 * - [ ] subnet CIDR -> machines
		 * - [ ] hosts -> machines
		 */
		function getTargets(query: string): number[] {
			const ids: number[] = [];

			// *
			if (query === '*') {
				for (const machine of data.machines || []) {
					if (machine.nodeId) ids.push(machine.nodeId);
				}
				return ids; // Makes no sense to go further as there should be no more matches
			}

			// Groups -> members -> machines
			if (groupRegex.test(query)) {
				const group = data.acl.groups.find((group) => group.name === query);
				if (group?.members.length) {
					for (const member of group.members) {
						for (const target of getTargets(member)) ids.push(target);
					}
				}
				return ids; // Makes no sense to go further as there should be no more matches
			}

			// Tags -> machines
			if (tagRegex.test(query)) {
				const machines =
					data.machines?.filter(
						(machine) => machine.validTags?.includes(query) || machine.forcedTags?.includes(query)
					) || [];
				for (const machine of machines) {
					if (machine.nodeId) ids.push(machine.nodeId);
				}
				return ids; // Makes no sense to go further as there should be no more matches
			}

			// Hosts -> machines
			// TODO

			// CIDR -> machines
			// TODO

			// Tailnet IP -> machines
			// TODO

			// Users -> machines
			const user = data.users?.find((user) => user.name === query);
			if (user?.id) {
				for (const machine of data.machines?.filter((machine) => machine.user?.id === user.id) ||
					[]) {
					if (machine.nodeId) ids.push(machine.nodeId);
				}
			}

			return ids;
		}

		// Main ACL rules
		for (const rule of data.acl.acls) {
			for (const dst of rule.dst) {
				if (dst.host === 'autogroup:internet') {
					// Exit nodes (autogroup:internet)
					for (const src of rule.src) {
						for (const target of getTargets(src)) {
							for (const exitNode of exitNodes) {
								graphData.links.push({
									source: target,
									target: exitNode.nodeId
								});
							}
						}
					}
				} else {
					// Basic targets
					const targets = getTargets(dst.host);

					for (const src of rule.src) {
						for (const source of getTargets(src)) {
							for (const target of targets) {
								graphData.links.push({ source, target });
							}
						}
					}
				}
			}
		}
	}

	onMount(async () => {
		preAuthKeys.set(await PreAuthKey.list(data.users || []));
	});

	console.debug({ nodes: graphData.nodes.length, links: graphData.links.length });
</script>

<main class="relative overflow-x-hidden overflow-y-hidden">
	<NetworkGraph {graphData}>
		<svelte:fragment slot="node-info" let:nodeInfo let:selected>
			{#if selected instanceof User}
				<Sheet.Header>
					<Sheet.Title class="flex items-center gap-1.5">
						<Button variant="ghost" class="h-7 w-7 p-1.5">
							<EllipsisVertical class="h-4 w-4" />
						</Button>

						<span>
							{selected.name}
						</span>

						{#if selected.id}
							<span class="text-muted-foreground">
								#{selected.id}
							</span>
						{/if}

						<!-- <button class="p-1.5 text-muted-foreground hover:text-foreground">
							<Pen class="h-4 w-4" />
						</button> -->
					</Sheet.Title>

					<Sheet.Description>
						Created on
						{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : undefined}
					</Sheet.Description>

					<GroupList class="pt-1" user={selected} acl={data.acl} />
				</Sheet.Header>

				<!-- <EditGroups user={selected} acl={data.acl} /> -->

				<Sheet.Header>
					<Sheet.Title>PreAuth keys</Sheet.Title>
				</Sheet.Header>

				<PreAuthKeyList keys={$preAuthKeys.filter((key) => key.user === selected.name)} />
			{:else if selected instanceof Machine}
				<Sheet.Header>
					<Sheet.Title class="flex items-center gap-1.5">
						<Button variant="ghost" class="h-7 w-7 p-1.5">
							<EllipsisVertical class="h-4 w-4" />
						</Button>

						<span>
							{selected.givenName}
						</span>

						{#if selected.id}
							<span class="text-muted-foreground">
								#{selected.id}
							</span>
						{/if}

						<MachineStatus online={selected.online} lastSeen={selected.lastSeen} />
					</Sheet.Title>

					<Sheet.Description class="flex items-center justify-between gap-2">
						<span>
							Created on
							{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : undefined}
						</span>
					</Sheet.Description>

					<div class="flex items-center gap-1.5 pt-1">
						{#if selected.expiry}
							{#if isExpired(selected.expiry)}
								<Badge variant="destructive">
									Session expired {new Date(selected.expiry).toDateString()}
								</Badge>
							{:else}
								<Badge variant="positive">
									Session expires {neverExpires(selected.expiry)
										? 'never'
										: formatDuration(Date.now() - new Date(selected.expiry).getTime())}
								</Badge>
							{/if}
						{/if}

						{#if selected.registerMethod}
							<Badge variant="outline">
								{selected.registerMethod}
							</Badge>
						{/if}

						{#each [...(selected.validTags || []), ...(selected.forcedTags || [])] as tag}
							<Badge>{tag}</Badge>
						{/each}

						{#each selected.invalidTags || [] as tag}
							<Badge variant="destructive">{tag}</Badge>
						{/each}
					</div>
				</Sheet.Header>

				<div style="height: 1px;"></div>

				<MachineInfo machine={selected} />

				<Sheet.Header>
					<Sheet.Title>Routes</Sheet.Title>
				</Sheet.Header>

				<MachineRoutes machine={selected} routes={data.routes} />
			{:else if selected && 'nodeId' in selected && selected.nodeId === 1}
				<Sheet.Header>
					<Sheet.Title>Internet</Sheet.Title>
				</Sheet.Header>
			{:else}
				404: Node not found
			{/if}

			<!-- <pre class="mt-10"><code>{stringify({ node: selected })}</code></pre> -->
		</svelte:fragment>

		<svelte:fragment slot="node-actions" let:nodeActions let:selected>
			{#if selected instanceof User}
				<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
					<div>
						<span>{selected.name}</span>
						<span class="text-muted-foreground">#{selected.id}</span>
					</div>

					<button
						class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted"
						on:click={nodeActions.close}
					>
						<X class="h-4 w-4" />
					</button>
				</div>
				<hr />

				<li>
					<button disabled>
						<span>
							<EyeClosed />
						</span>
						<span> Hide </span>
					</button>
				</li>

				<li>
					<button disabled>
						<UserRoundPen />
						<span>Edit</span>
					</button>
				</li>

				<li class="destructive">
					<button disabled>
						<Trash />
						<span>Delete</span>
					</button>
				</li>
			{:else if selected instanceof Machine}
				<div class="grid items-center gap-2" style="grid-template-columns: auto 1fr auto;">
					<MachineStatus online={selected.online} lastSeen={selected.lastSeen} />

					<div>
						<span>{selected.givenName}</span>
						<span class="text-muted-foreground">#{selected.id}</span>
					</div>

					<button
						class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted"
						on:click={nodeActions.close}
					>
						<X class="h-4 w-4" />
					</button>
				</div>
				<hr />

				<li>
					<button disabled>
						<span>
							<EyeClosed />
						</span>
						<span> Hide </span>
					</button>
				</li>

				<li>
					<button disabled>
						<MonitorCog />
						<span>Edit</span>
					</button>
				</li>

				<li class="destructive">
					<button disabled>
						<ShieldOff />
						<span>Expire session</span>
					</button>
				</li>

				<li class="destructive">
					<button disabled>
						<Trash />
						<span>Delete</span>
					</button>
				</li>
			{:else if selected && 'nodeId' in selected && selected.nodeId === 1}
				<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
					<span>Internet</span>
					<button
						class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted"
						on:click={nodeActions.close}
					>
						<X class="h-4 w-4" />
					</button>
				</div>
				<hr />

				<li>
					<button disabled>
						<span>
							<EyeClosed />
						</span>
						<span> Hide </span>
					</button>
				</li>
			{:else}
				<div class="text-red-600">Node not found</div>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="page-actions" let:pageActions>
			<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
				<span>Quick actions</span>
				<button
					class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted"
					on:click={pageActions.close}
				>
					<X class="h-4 w-4" />
				</button>
			</div>
			<hr />

			<li>
				<Sheet.Root onOpenChange={(open) => (open ? void 0 : pageActions.close())}>
					<Sheet.Trigger>
						<Plus />
						<span> User </span>
					</Sheet.Trigger>

					<Sheet.Content>
						<Sheet.Header>
							<Sheet.Title>Create user</Sheet.Title>
						</Sheet.Header>
					</Sheet.Content>
				</Sheet.Root>
			</li>

			<li>
				<Sheet.Root onOpenChange={(open) => (open ? void 0 : pageActions.close())}>
					<Sheet.Trigger>
						<Plus />
						<span> Machine </span>
					</Sheet.Trigger>

					<Sheet.Content>
						<Sheet.Header>
							<Sheet.Title>Register machine</Sheet.Title>
						</Sheet.Header>
					</Sheet.Content>
				</Sheet.Root>
			</li>

			<hr />

			<li>
				<button disabled>
					<Network />
					<span>Hosts</span>
				</button>
			</li>

			<li>
				<button disabled>
					<Users />
					<span>Groups</span>
				</button>
			</li>

			<li>
				<button disabled>
					<KeyRound />
					<span>Api keys</span>
				</button>
			</li>

			<li>
				<button disabled>
					<Braces />
					<span>Policy</span>
				</button>
			</li>

			<hr />

			<li>
				<button disabled>
					<Sliders />
					<span> Filters </span>
				</button>
			</li>

			<li>
				<a href="{base}/settings">
					<span>
						<Cog />
					</span>
					<span> Settings </span>
				</a>
			</li>

			<li class="destructive">
				<button>
					<LogOut />
					<span> Log out </span>
				</button>
			</li>
		</svelte:fragment>
	</NetworkGraph>
</main>
