<script lang="ts">
	import type { ForceGraph3DGenericInstance } from '3d-force-graph';

	import MoveRight from 'lucide-svelte/icons/move-right';

	import * as Sheet from '$lib/components/ui/sheet';

	import RuleInfo from '$lib/components/data/acl/RuleInfo.svelte';

	import type { Acl } from '$lib/api';
	import {
		focusOnNode,
		GraphMachine,
		GraphUser,
		type GraphDataLink
	} from '$lib/utils/networkGraph';

	export let graph: ForceGraph3DGenericInstance<any>;
	export let link: GraphDataLink | undefined;
	export let close: () => void;

	const rules = new Set<Acl['acls'][0]>();
	const rulePrefixes: { [x: string]: Set<string> } = {};

	for (const route of link?.routes || []) {
		if (route.rule) {
			rules.add(route.rule);
			if (!(rulePrefixes[route.rule.id] instanceof Set)) {
				rulePrefixes[route.rule.id] = new Set();
			}
			rulePrefixes[route.rule.id].add(`${route.host}:${route.port}`);
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
			<RuleInfo {rule} prefixes={{ out: rulePrefixes[rule.id] || new Set(), in: new Set() }} />
		{/each}
	</div>

	<!-- <Code
		yaml={[...rules].map((rule) => ({ ...rule, id: undefined, prefixes: rulePrefixes[rule.id] }))}
	/> -->
{/if}
