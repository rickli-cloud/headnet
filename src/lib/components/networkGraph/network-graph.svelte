<script lang="ts">
	import ForceGraph3D from '3d-force-graph';
	import type { ClassValue } from 'clsx';
	import { onMount } from 'svelte';

	import { page } from '$app/stores';

	import NodeInfo from './node-info.svelte';
	import NetworkGraphActions from './network-graph-actions.svelte';
	import type { GraphData } from '.';

	let target: HTMLElement;
	let nodeInfo: NodeInfo;
	let nodeActions: NetworkGraphActions;
	let pageActions: NetworkGraphActions;

	const graph = ForceGraph3D({});

	graph.nodeId('nodeId');
	graph.nodeLabel('nodeName');
	graph.showNavInfo(false);
	graph.backgroundColor('#0a0a0a');
	graph.linkColor(() => '#fff');
	graph.linkDirectionalArrowLength(2);
	graph.linkDirectionalArrowRelPos(1);
	graph.linkCurvature(0.1);

	// TODO:
	// - Dark & light mode
	// - Resize on window size change

	interface $$Props extends Partial<HTMLDivElement> {
		class?: ClassValue;
		graphData: GraphData;
	}

	export let graphData: $$Props['graphData'];

	page.subscribe((state) => graph.graphData(state.data.graphData));
	graph.graphData(graphData);

	function closeEveryPopup(): void {
		nodeActions.close();
		pageActions.close();
	}

	graph.onNodeClick((node, ev) => {
		closeEveryPopup();
		nodeInfo.open(node);
	});

	graph.onNodeRightClick((node, ev) => {
		closeEveryPopup();
		nodeActions.open(node, ev);
	});

	graph.onBackgroundRightClick((ev) => {
		closeEveryPopup();
		pageActions.open({}, ev);
	});

	graph.onBackgroundClick(closeEveryPopup);
	graph.onNodeDrag(closeEveryPopup);
	graph.onLinkClick(closeEveryPopup);
	graph.onLinkRightClick(closeEveryPopup);

	onMount(() => {
		graph(target);
		return graph._destructor;
	});
</script>

<main {...$$restProps} bind:this={target}></main>

<slot />

<NodeInfo bind:this={nodeInfo} let:selected>
	<slot name="node-info" {nodeInfo} {selected} />
</NodeInfo>

<NetworkGraphActions bind:this={nodeActions} let:selected>
	<slot name="node-actions" {nodeActions} {selected} />
</NetworkGraphActions>

<NetworkGraphActions bind:this={pageActions}>
	<slot name="page-actions" {pageActions} />
</NetworkGraphActions>
