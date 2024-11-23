<script lang="ts">
	import { Address4, Address6 } from 'ip-address';
	import { createEventDispatcher } from 'svelte';

	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	// import MonitorCog from 'lucide-svelte/icons/monitor-cog';
	// import Trash from 'lucide-svelte/icons/trash-2';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import ToggleRoute from '$lib/components/data/routes/ToggleRoute.svelte';
	import RuleInfo from '$lib/components/data/acl/RuleInfo.svelte';

	import Secret from '$lib/components/utils/Secret.svelte';

	import {
		focusOnNode,
		GraphMachine,
		isLinkNode,
		type GraphDataLink
	} from '$lib/utils/networkGraph';
	import { formatDuration, isExpired, neverExpires } from '$lib/utils/time';
	import { Acl, User, type AclData, type Route } from '$lib/api';

	import MachineActions from './MachineActions.svelte';
	import MachineStatus from './MachineStatus.svelte';
	import { invertHex } from '$lib/utils/misc';
	// import DeleteMachine from './DeleteMachine.svelte';
	// import EditMachine from './EditMachine.svelte';

	export let machine: GraphMachine;
	export let routes: Route[] | undefined;
	export let links: GraphDataLink[];
	export let users: User[];
	export let acl: Acl;

	const dispatch = createEventDispatcher<{ close: undefined; focus: undefined }>();

	const rawAclRules = new Set<AclData['acls'][0]>();
	const rulePrefixes: { [id: string]: { in: Set<string>; out: Set<string> } } = {};

	for (const link of links) {
		if (isLinkNode(link.target, machine.nodeId)) {
			for (const route of link.routes) {
				if (route.rule) {
					rawAclRules.add(route.rule);

					if (typeof rulePrefixes[route.rule.id] !== 'object') {
						rulePrefixes[route.rule.id] = { in: new Set(), out: new Set() };
					}

					rulePrefixes[route.rule.id].in.add(`${route.host}:${route.port}`);
				}
			}
		}

		if (isLinkNode(link.source, machine.nodeId)) {
			for (const route of link.routes) {
				if (route.rule) {
					rawAclRules.add(route.rule);

					if (typeof rulePrefixes[route.rule.id] !== 'object') {
						rulePrefixes[route.rule.id] = { in: new Set(), out: new Set() };
					}

					rulePrefixes[route.rule.id].out.add(`${route.host}:${route.port}`);
				}
			}
		}
	}

	const aclRules = [...rawAclRules].map((rule) => ({
		...rule,
		prefixes: rulePrefixes[rule.id] || []
	}));
</script>

<Sheet.Header>
	<Sheet.Title class="flex items-center gap-1.5 font-normal">
		<!-- <DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="ghost" class="h-7 w-7 p-1.5">
					<EllipsisVertical class="h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="start" class="min-w-64 max-w-96">
				<DropdownMenu.Group>
					<DropdownMenu.Item asChild>
						<EditMachine {machine}>
							<svelte:fragment slot="trigger" let:builder>
								<button class="menu-button" {...builder} use:builder.action>
									<MonitorCog class="mr-2 h-4 w-4" />
									<span>Edit</span>
								</button>
							</svelte:fragment>
						</EditMachine>
					</DropdownMenu.Item>

					<DropdownMenu.Item asChild>
						<DeleteMachine {machine}>
							<svelte:fragment slot="trigger" let:builder>
								<button class="menu-button destructive" {...builder} use:builder.action>
									<Trash class="mr-2 h-4 w-4" />
									<span>Delete</span>
								</button>
							</svelte:fragment>
						</DeleteMachine>
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root> -->

		<span class="font-semibold">
			{machine.givenName}
		</span>

		{#if machine.id}
			<span class="text-muted-foreground">
				#{machine.id}
			</span>
		{/if}

		<MachineStatus autofocus online={machine.online} lastSeen={machine.lastSeen} />
	</Sheet.Title>

	<Sheet.Description class="flex items-center justify-between gap-2">
		<span>
			Created on
			{machine.createdAt ? new Date(machine.createdAt).toLocaleString() : undefined}
		</span>
	</Sheet.Description>

	<div class="flex flex-wrap items-center gap-x-1.5 gap-y-2 pt-1">
		<Badge
			style="color: {invertHex(machine.color.replace(/^#/, ''))}; background-color: {machine.color}"
		>
			User: {machine.user?.name}
		</Badge>

		{#if machine.expiry}
			{#if isExpired(machine.expiry)}
				<Badge variant="destructive">
					Session expired: {new Date(machine.expiry).toDateString()}
				</Badge>
			{:else}
				<Badge variant="positive">
					Session expires: {neverExpires(machine.expiry)
						? 'never'
						: formatDuration(Date.now() - new Date(machine.expiry).getTime())}
				</Badge>
			{/if}
		{/if}

		{#if machine.registerMethod}
			<Badge variant="outline">
				{machine.registerMethod}
			</Badge>
		{/if}

		{#each [...(machine.validTags || []), ...(machine.forcedTags || [])] as tag}
			<Badge>{tag}</Badge>
		{/each}

		{#each machine.invalidTags || [] as tag}
			<Badge variant="destructive">{tag}</Badge>
		{/each}
	</div>
</Sheet.Header>

<ul class="menu">
	<MachineActions
		{machine}
		{users}
		on:close={() => dispatch('close')}
		on:focus={() => dispatch('focus')}
	/>
</ul>

<!-- <div style="height: 1px;"></div> -->

<div class="space-y-2">
	<div class="text-sm font-medium">Disco Key</div>
	<Secret secret={machine.discoKey} />
</div>

<div class="space-y-2">
	<div class="text-sm font-medium">Node Key</div>
	<Secret secret={machine.nodeKey} />
</div>

<div class="space-y-2">
	<div class="text-sm font-medium">Machine Key</div>
	<Secret secret={machine.machineKey} />
</div>

<div class="space-y-2">
	<div class="text-sm font-medium">Addresses</div>
	<ul class="list-disc pl-6">
		{#each machine.ipAddresses || [] as ip}
			<li>
				<button
					class="hover:underline"
					on:click={() => navigator.clipboard.writeText(ip)}
					on:dblclick={() =>
						open(
							Address4.isValid(ip) ? `http://${ip}` : Address6.isValid(ip) ? `http://[${ip}]` : ip,
							'_blank'
						)}
				>
					<span>{ip}</span>
				</button>
			</li>
		{/each}
	</ul>
</div>

<Sheet.Header>
	<Sheet.Title>Routes</Sheet.Title>
</Sheet.Header>

{#if routes?.filter((route) => route.node?.id === machine.id).length}
	<div>
		{#each routes?.filter((route) => route.node?.id === machine.id) || [] as route}
			<div class="space-y-1.5 border-b px-1 py-3 first:pt-0 last:border-none">
				<div class="flex flex-wrap items-center gap-1.5">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} variant="ghost" class="h-7 w-7 p-1.5">
								<EllipsisVertical class="h-4 w-4" />
							</Button>
						</DropdownMenu.Trigger>

						<DropdownMenu.Content align="start" class="min-w-64 max-w-96">
							<DropdownMenu.Group>
								<DropdownMenu.Item asChild>
									<ToggleRoute {route}>
										<svelte:fragment slot="trigger" let:builder>
											<button
												class="menu-button"
												class:destructive={route.enabled}
												{...builder}
												use:builder.action
											>
												{#if route.enabled}
													<ToggleLeft class="mr-2 h-4 w-4" />
													<span>Disable</span>
												{:else}
													<ToggleRight class="mr-2 h-4 w-4" />
													<span>Enable</span>
												{/if}
											</button>
										</svelte:fragment>
									</ToggleRoute>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<span class="mr-1.5 font-medium">{route.prefix}</span>

					{#if route.advertised}
						<Badge variant="outline">Advertised</Badge>
					{/if}

					{#if route.isPrimary}
						<Badge variant="outline">Primary</Badge>
					{/if}

					{#if !route.enabled}
						<Badge variant="destructive">Disabled</Badge>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div>
		<p class="w-full text-center text-sm text-muted-foreground">no routes advertised</p>
	</div>
{/if}

<Sheet.Header>
	<Sheet.Title>Rules</Sheet.Title>
</Sheet.Header>

{#if aclRules.length}
	<div class="space-y-4">
		{#each aclRules as rule}
			<RuleInfo {rule} {users} {acl} prefixes={rulePrefixes[rule.id]} />
		{/each}
	</div>
{:else}
	<div>
		<p class="w-full text-center text-sm text-muted-foreground">no rules found</p>
	</div>
{/if}
