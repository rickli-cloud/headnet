<script lang="ts">
	import { type ForceGraph3DGenericInstance } from '3d-force-graph';
	import SpriteText from 'three-spritetext';
	import type { ClassValue } from 'clsx';
	import { mode } from 'mode-watcher';
	import { onMount } from 'svelte';

	import type { GraphDataLink } from '$lib/utils/networkGraph';

	interface $$Props extends Partial<HTMLDivElement> {
		class?: ClassValue;
		graph: ForceGraph3DGenericInstance<any>;
	}

	export let graph: $$Props['graph'];

	let target: HTMLElement;

	const observer = new ResizeObserver(function () {
		graph.width(window.innerWidth);
		graph.height(window.innerHeight);
	});

	mode.subscribe(setTheme);

	graph.showNavInfo(true); // TODO: change to setting

	graph.nodeId('nodeId');
	graph.nodeLabel('nodeName');

	graph.linkDirectionalArrowLength(2);
	graph.linkDirectionalArrowRelPos(1);
	graph.linkCurvature(0.1);

	graph.linkThreeObjectExtend(true);
	graph.linkThreeObject((link: GraphDataLink) => {
		if (link.routes?.length) {
			const sprite = new SpriteText(
				link.routes.map((route) => `${route.host}:${route.port}`).join(', ')
			);
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

	onMount(() => {
		graph(target);

		if (target.parentElement) observer.observe(target.parentElement);

		return () => {
			observer.disconnect();
			graph._destructor();
		};
	});

	function setTheme(mode: 'dark' | 'light' | undefined) {
		if (mode === 'dark') {
			graph.backgroundColor('#0a0a0a');
			graph.linkColor(() => '#fff');
		}

		if (mode === 'light') {
			graph.backgroundColor('#fff');
			graph.linkColor(() => '#0a0a0a');
		}
	}
</script>

<div {...$$restProps} bind:this={target}></div>
