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

<table class="basic-table w-full">
	<tbody>
		<tr>
			<td>Source</td>
			{#if link?.source instanceof GraphUser}
				<td>
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
				</td>
				<td></td>
			{:else if link?.source instanceof GraphMachine}
				<td>
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
				</td>
				<td>
					{link.source.ipAddresses?.join(', ')}
				</td>
			{/if}
		</tr>

		<tr>
			<td>Target</td>
			{#if link?.target instanceof GraphMachine}
				<td>
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
				</td>
				<td>{link.target.ipAddresses?.join(', ')}</td>
			{/if}
		</tr>
	</tbody>
</table>

{#if rules.size}
	<Sheet.Header>
		<Sheet.Title>Rules</Sheet.Title>
	</Sheet.Header>

	<div class="space-y-3">
		{#each rules as rule}
			<div class="space-y-2 border-b pb-3 last:border-b-0">
				<div class="flex items-center gap-1.5">
					<Button variant="ghost" class="h-7 w-7 p-1.5">
						<EllipsisVertical class="h-4 w-4" />
					</Button>

					{#each rulePrefixes[rule.id] || [] as prefix}
						<Badge variant="outline">{prefix}</Badge>
					{/each}
				</div>

				<div
					class="grid items-center gap-1.5 whitespace-nowrap"
					style="grid-template-columns: 1fr auto 1fr;"
				>
					<div class="flex flex-wrap items-center justify-end gap-1.5">
						{#each [...rule.src] as src}
							<Badge>{src}</Badge>
						{/each}
					</div>
					<div class="px-4 text-center">
						<MoveRight class="h-4 w-4" />
					</div>
					<div class="flex flex-wrap items-center gap-1.5">
						{#each rule.dst as dst}
							<Badge>{dst.host}:{dst.port}</Badge>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div>
		<pre><code
				>{stringify(
					[...rules].map((rule) => ({ ...rule, id: undefined, prefixes: rulePrefixes[rule.id] }))
				)}</code
			></pre>
	</div>
{/if}
