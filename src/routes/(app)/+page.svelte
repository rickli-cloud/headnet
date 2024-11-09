<script lang="ts">
	import { get, writable } from 'svelte/store';
	import ForceGraph3D from '3d-force-graph';
	import { onMount } from 'svelte';

	import * as Sheet from '$lib/components/ui/sheet';

	import MachineInfo from '$lib/components/data/machine/MachineInfo.svelte';
	import UserInfo from '$lib/components/data/user/UserInfo.svelte';
	import UserActions from '$lib/components/data/user/UserActions.svelte';
	import MachineActions from '$lib/components/data/machine/MachineActions.svelte';
	import InternetActions from '$lib/components/data/internet/InternetActions.svelte';
	import PageActions from '$lib/components/data/page/PageActions.svelte';

	import { NetworkGraph, type GraphData } from '$lib/components/networkGraph';

	import { Machine, PreAuthKey, User } from '$lib/api/headscale.js';
	import { focusOnNode, formatGraphData } from '$lib/utils/networkGraph.js';
	import { NetworkGraphActions } from '$lib/components/networkGraph';

	export let data;

	let nodeInfo: Sheet.Root;
	let nodeActions: NetworkGraphActions;
	let pageActions: NetworkGraphActions;

	const graph = ForceGraph3D({});

	const graphData = writable<GraphData>(formatGraphData(data));
	graphData.subscribe((d) => console.debug({ nodes: d?.nodes.length, links: d?.links.length }));
	graphData.subscribe(graph.graphData);

	const preAuthKeys = writable<PreAuthKey[]>([]);
	preAuthKeys.subscribe(console.debug);

	const selected = writable<object | undefined>(undefined);
	selected.subscribe(console.debug);

	function closeEveryPopup(): void {
		nodeActions.close();
		pageActions.close();
		selected.set(undefined);
	}

	graph.onNodeClick((node, ev) => {
		closeEveryPopup();
		focusOnNode(graph, node);
		selected.set(node);
		nodeInfo.open();
	});

	graph.onNodeRightClick(async (node, ev) => {
		closeEveryPopup();
		selected.set(node);
		nodeActions.open(ev);
	});

	graph.onBackgroundRightClick((ev) => {
		closeEveryPopup();
		pageActions.open(ev);
	});

	graph.onBackgroundClick(closeEveryPopup);
	graph.onNodeDrag(closeEveryPopup);
	graph.onLinkClick(closeEveryPopup);
	graph.onLinkRightClick(closeEveryPopup);

	onMount(async () => {
		preAuthKeys.set(await PreAuthKey.list(data.users || []));
	});
</script>

<main class="relative overflow-x-hidden overflow-y-hidden">
	<NetworkGraph {graph} />

	<Sheet.Root bind:this={nodeInfo}>
		<Sheet.Content>
			{#if $selected instanceof User}
				<UserInfo user={$selected} acl={data.acl} preAuthKeys={$preAuthKeys} />
			{:else if $selected instanceof Machine}
				<MachineInfo machine={$selected} routes={data.routes} />
			{:else if $selected && 'nodeId' in $selected && $selected.nodeId === 1}
				<Sheet.Header>
					<Sheet.Title>Internet</Sheet.Title>
				</Sheet.Header>
			{:else}
				<div class="text-red-600">Node not found</div>
			{/if}
		</Sheet.Content>
	</Sheet.Root>

	<NetworkGraphActions bind:this={nodeActions}>
		{#if $selected instanceof User}
			{#key $selected}
				<UserActions user={$selected} acl={data.acl} on:close={nodeActions.close} />
			{/key}
		{:else if $selected instanceof Machine}
			{#key $selected}
				<MachineActions machine={$selected} on:close={nodeActions.close} />
			{/key}
		{:else if $selected && 'nodeId' in $selected && $selected.nodeId === 1}
			<InternetActions on:close={nodeActions.close} />
		{:else}
			<div class="text-red-600">Node not found</div>
		{/if}
	</NetworkGraphActions>

	<NetworkGraphActions bind:this={pageActions}>
		<PageActions on:close={pageActions.close} acl={data.acl} />
	</NetworkGraphActions>
</main>
