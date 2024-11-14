<script lang="ts">
	import { Address4, Address6 } from 'ip-address';

	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';
	import Trash from 'lucide-svelte/icons/trash-2';
	import MonitorCog from 'lucide-svelte/icons/monitor-cog';
	import ToggleLeft from 'lucide-svelte/icons/toggle-left';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import ToggleRoute from '$lib/components/data/routes/ToggleRoute.svelte';

	import Secret from '$lib/components/utils/Secret.svelte';

	import { formatDuration, isExpired, neverExpires } from '$lib/utils/time';
	import { Machine, type Route } from '$lib/api';

	import MachineStatus from './MachineStatus.svelte';
	import DeleteMachine from './DeleteMachine.svelte';
	import EditMachine from './EditMachine.svelte';

	export let machine: Machine;
	export let routes: Route[] | undefined;
	export let minimal: boolean = false;
</script>

<Sheet.Header>
	<Sheet.Title class="flex items-center gap-1.5 font-normal">
		<DropdownMenu.Root>
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
		</DropdownMenu.Root>

		<span class="font-semibold">
			{machine.givenName}
		</span>

		{#if machine.id}
			<span class="text-muted-foreground">
				#{machine.id}
			</span>
		{/if}

		<MachineStatus online={machine.online} lastSeen={machine.lastSeen} />
	</Sheet.Title>

	<Sheet.Description class="flex items-center justify-between gap-2">
		<span>
			Created on
			{machine.createdAt ? new Date(machine.createdAt).toLocaleString() : undefined}
		</span>
	</Sheet.Description>

	<div class="flex flex-wrap items-center gap-x-1.5 gap-y-2 pt-1">
		{#if machine.expiry}
			{#if isExpired(machine.expiry)}
				<Badge variant="destructive">
					Session expired {new Date(machine.expiry).toDateString()}
				</Badge>
			{:else}
				<Badge variant="positive">
					Session expires {neverExpires(machine.expiry)
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

{#if !minimal}
	<div style="height: 1px;"></div>

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
								Address4.isValid(ip)
									? `http://${ip}`
									: Address6.isValid(ip)
										? `http://[${ip}]`
										: ip,
								'_blank'
							)}
					>
						<span>{ip}</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
{/if}

{#if routes?.filter((route) => route.node?.id === machine.id).length && !minimal}
	<Sheet.Header>
		<Sheet.Title>Routes</Sheet.Title>
	</Sheet.Header>

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
{/if}
