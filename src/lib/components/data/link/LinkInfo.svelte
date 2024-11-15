<script lang="ts">
	import { stringify } from 'yaml';

	import MoveRight from 'lucide-svelte/icons/move-right';
	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';

	import * as Sheet from '$lib/components/ui/sheet';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	import {
		focusOnNode,
		GraphMachine,
		GraphUser,
		type GraphDataLink
	} from '$lib/utils/networkGraph';
	import type { Acl } from '$lib/api';
	import type { ForceGraph3DGenericInstance } from '3d-force-graph';
	import Label from '$lib/components/ui/label/label.svelte';
	import Code from '$lib/components/utils/Code.svelte';

	export let graph: ForceGraph3DGenericInstance<any>;
	export let link: GraphDataLink | undefined;
	export let close: () => void;

	const rules = new Set<Acl['acls'][0]>();
	const rulePrefixes: { [x: string]: string[] } = {};

	for (const route of link?.routes || []) {
		if (route.rule) {
			rules.add(route.rule);
			if (!Array.isArray(rulePrefixes[route.rule.id])) rulePrefixes[route.rule.id] = [];
			rulePrefixes[route.rule.id].push(`${route.host}:${route.port}`);
		}
	}
</script>

<div class="grid items-center gap-5" style="grid-template-columns: 1fr auto 1fr;">
	<div class="text-right">
		{#if link?.source instanceof GraphUser}
			<button
				class="link"
				on:click={() => {
					close();
					focusOnNode(graph, link.source);
				}}
			>
				<span class="font-semibold">
					{link.source.name}
				</span>
				<span class="text-muted-foreground">
					#{link.source.id}
				</span>
			</button>
			<p></p>
		{:else if link?.source instanceof GraphMachine}
			<button
				class="link"
				on:click={() => {
					close();
					focusOnNode(graph, link.source);
				}}
			>
				<span class="font-semibold">
					{link.source.givenName || link.source.name}
				</span>
				<span class="text-muted-foreground">
					#{link.source.id}
				</span>
			</button>
			<p>
				{link.source.ipAddresses?.join(', ')}
			</p>
		{/if}
	</div>
	<div>
		<MoveRight />
	</div>
	<div>
		{#if link?.target instanceof GraphMachine}
			<button
				class="link"
				on:click={() => {
					close();
					focusOnNode(graph, link.target);
				}}
			>
				<span class="font-semibold">
					{link.target.givenName || link.target.name}
				</span>
				<span class="text-muted-foreground">
					#{link.target.id}
				</span>
			</button>
			<p>
				{link.target.ipAddresses?.join(', ')}
			</p>
		{:else if link?.target && (link.target === 1 || (typeof link.target === 'object' && 'nodeId' in link.target && link.target.nodeId === 1))}
			<button
				class="link"
				on:click={() => {
					close();
					focusOnNode(graph, link.target);
				}}
			>
				<span class="font-semibold"> Internet </span>
				<span class="text-muted-foreground"> #1 </span>
			</button>
			<p>0.0.0.0/0, ::/0</p>
		{/if}
	</div>
</div>

{#if rules.size}
	<Sheet.Header>
		<Sheet.Title>Rules</Sheet.Title>
	</Sheet.Header>

	<div class="space-y-4">
		{#each rules as rule}
			<div class="space-y-3 border-b pb-4 last:border-b-0 [&>div]:space-y-2">
				<div>
					<div class="flex items-center justify-between">
						<Label>Routes</Label>
						<button class="link text-muted-foreground hover:text-current">Edit</button>
					</div>
					<div class="flex flex-wrap items-center gap-1.5">
						{#each rulePrefixes[rule.id] || [] as prefix}
							<Badge variant="outline">{prefix}</Badge>
						{/each}
					</div>
				</div>

				<div>
					<Label>Source</Label>

					<div class="flex flex-wrap items-center gap-1.5">
						{#each rule.src as src}
							<Badge>{src}</Badge>
						{/each}
					</div>
				</div>

				<div>
					<Label>Destination</Label>
					<div class="flex flex-wrap items-center gap-1.5">
						{#each rule.dst as dst}
							<Badge>{dst.host}:{dst.port}</Badge>
						{/each}
					</div>
				</div>

				{#if rule.comments?.length}
					<div class="space-y-1.5">
						{#each rule.comments as comment}
							<p>{comment}</p>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- <Code
		yaml={[...rules].map((rule) => ({ ...rule, id: undefined, prefixes: rulePrefixes[rule.id] }))}
	/> -->
{/if}
