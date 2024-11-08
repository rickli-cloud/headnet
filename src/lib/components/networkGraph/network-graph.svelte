<script lang="ts">
	import { type ForceGraph3DGenericInstance } from '3d-force-graph';
	import type { ClassValue } from 'clsx';
	import { onMount } from 'svelte';

	interface $$Props extends Partial<HTMLDivElement> {
		class?: ClassValue;
		graph: ForceGraph3DGenericInstance<any>;
	}

	export let graph: $$Props['graph'];

	let target: HTMLElement;

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

	onMount(() => {
		graph(target);
		return graph._destructor;
	});
</script>

<div {...$$restProps} bind:this={target}></div>
