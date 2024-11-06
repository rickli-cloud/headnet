<script lang="ts">
	import ForceGraph3D from '3d-force-graph';
	import type { ClassValue } from 'clsx';
	import { onMount } from 'svelte';

	import * as Sheet from '$lib/components/ui/sheet';

	import NetworkGraphActions from './network-graph-actions.svelte';
	import type { GraphData } from '.';

	import { page } from '$app/stores';
	import { get, writable, type Writable } from 'svelte/store';

	interface $$Props extends Partial<HTMLDivElement> {
		class?: ClassValue;
		graphData: Writable<GraphData>;
	}

	export let graphData: $$Props['graphData'];

	let target: HTMLElement;
	let nodeInfo: Sheet.Root;
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

	page.subscribe((state) => graph.graphData(state.data.graphData));

	graphData.subscribe(graph.graphData);
	graph.graphData(get(graphData));

	function closeEveryPopup(): void {
		nodeActions.close();
		pageActions.close();
		selected.set(undefined);
	}

	graph.onNodeClick((node, ev) => {
		closeEveryPopup();
		selected.set(node);
		nodeInfo.open();
	});

	graph.onNodeRightClick((node, ev) => {
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

	onMount(() => {
		graph(target);
		return graph._destructor;
	});

	const selected = writable<object | undefined>(undefined);
</script>

<div {...$$restProps} bind:this={target}></div>

<slot />

<Sheet.Root bind:this={nodeInfo}>
	<Sheet.Content>
		<slot name="node-info" {nodeInfo} selected={$selected} />
	</Sheet.Content>
</Sheet.Root>

<NetworkGraphActions bind:this={nodeActions}>
	<slot name="node-actions" {nodeActions} selected={$selected} />
</NetworkGraphActions>

<NetworkGraphActions bind:this={pageActions}>
	<slot name="page-actions" {pageActions} />
</NetworkGraphActions>
