<script lang="ts">
	import { type ForceGraph3DGenericInstance } from '3d-force-graph';
	import type { ClassValue } from 'clsx';
	import { onMount } from 'svelte';

	import SpriteText from 'three-spritetext';
	import type { GraphDataLink } from '.';

	interface $$Props extends Partial<HTMLDivElement> {
		class?: ClassValue;
		graph: ForceGraph3DGenericInstance<any>;
	}

	export let graph: $$Props['graph'];

	let target: HTMLElement;

	graph.nodeId('nodeId');
	graph.nodeLabel('nodeName');

	graph.linkDirectionalArrowLength(2);
	graph.linkDirectionalArrowRelPos(1);
	graph.linkCurvature(0.1);

	graph.backgroundColor('#0a0a0a'); // TODO: Dark & light mode
	graph.linkColor(() => '#fff');

	graph.showNavInfo(true); // TODO: change to setting

	graph.linkThreeObjectExtend(true);
	graph.linkThreeObject((link: GraphDataLink) => {
		if (link.cidr?.length) {
			const sprite = new SpriteText(link.cidr);
			sprite.color = 'lightgrey';
			sprite.textHeight = 1.5;
			return sprite;
		}
	});
	graph.linkPositionUpdate((sprite, { start, end }) => {
		if (sprite?.position) {
			Object.assign(sprite.position, {
				x: start['x'] + (end['x'] - start['x']) / 2,
				y: start['y'] + (end['y'] - start['y']) / 2,
				z: start['z'] + (end['z'] - start['z']) / 2
			});
		}
	});

	graph.d3Force('charge')?.strength(-360);

	// TODO: Resize on window size change

	onMount(() => {
		graph(target);
		return graph._destructor;
	});
</script>

<div {...$$restProps} bind:this={target}></div>
