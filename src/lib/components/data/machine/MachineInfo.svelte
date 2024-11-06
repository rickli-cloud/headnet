<script lang="ts">
	import { isV6Format, isV4Format } from 'ip';

	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';

	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import Secret from '$lib/components/utils/Secret.svelte';

	import { formatDuration, isExpired, neverExpires } from '$lib/utils/time';
	import type { Machine, Route } from '$lib/api';

	import MachineStatus from './MachineStatus.svelte';

	export let machine: Machine;
	export let routes: Route[] | undefined;
</script>

<Sheet.Header>
	<Sheet.Title class="flex items-center gap-1.5">
		<Button variant="ghost" class="h-7 w-7 p-1.5">
			<EllipsisVertical class="h-4 w-4" />
		</Button>

		<span>
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
							isV4Format(ip) ? 'http://' + ip : isV6Format(ip) ? `http://[${ip}]` : ip,
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

<div>
	{#each routes?.filter((route) => route.node?.id === machine.id) || [] as route}
		<div class="space-y-1.5 border-b px-1 py-3 first:pt-0 last:border-none">
			<div class="flex flex-wrap items-center gap-1.5">
				<button class="rounded p-2 hover:bg-muted">
					<EllipsisVertical class="h-4 w-4" />
				</button>

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
