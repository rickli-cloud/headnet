<script lang="ts">
	import type { Machine, Route } from '$lib/api';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';

	export let machine: Machine;
	export let routes: Route[] | undefined;
</script>

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
