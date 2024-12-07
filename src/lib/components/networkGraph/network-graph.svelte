<script lang="ts">
	import { type ForceGraph3DGenericInstance } from '3d-force-graph';
	// import SpriteText from 'three-spritetext';
	import type { ClassValue } from 'clsx';
	import { mode } from 'mode-watcher';
	import { onMount } from 'svelte';

	import Spinner from '$lib/components/utils/Spinner.svelte';

	import { GraphMachine, GraphUser } from '$lib/utils/networkGraph';
	import { debounce } from '$lib/utils/misc';

	interface $$Props extends Partial<HTMLDivElement> {
		graph: ForceGraph3DGenericInstance<any>;
		class?: ClassValue;
		opt?: Partial<{
			snapBack: boolean;
		}>;
	}

	export let graph: $$Props['graph'];
	export let opt: $$Props['opt'] = {};

	let target: HTMLElement;

	let hoverLink: object | undefined | null;

	const observer = new ResizeObserver(function () {
		graph.width(window.innerWidth);
		graph.height(window.innerHeight);
	});

	mode.subscribe(setTheme);

	graph.showNavInfo(false); // TODO: change to setting

	graph.nodeId('nodeId');
	graph.nodeLabel('nodeName');

	graph.linkThreeObjectExtend(true);
	graph.linkDirectionalArrowLength(2);
	graph.linkDirectionalArrowRelPos(1);
	graph.linkCurvature(0.1);

	graph.linkPositionUpdate((sprite, { start, end }) => {
		if (sprite?.position) {
			Object.assign(sprite.position, {
				x: start['x'] + (end['x'] - start['x']) / 2,
				y: start['y'] + (end['y'] - start['y']) / 2,
				z: start['z'] + (end['z'] - start['z']) / 2
			});
		}
	});
	// TODO: change to optional setting
	// graph.linkThreeObject((link: GraphDataLink) => {
	// 	if (link.label) {
	// 		const sprite = new SpriteText([...link.label].join(', '));
	// 		sprite.color = 'transparent';
	// 		sprite.textHeight = 1.5;
	// 		return sprite;
	// 	}
	// });

	graph.linkDirectionalParticles((link) => (hoverLink === link ? 3 : 0));
	graph.linkDirectionalParticleWidth(1);
	graph.onLinkHover(
		debounce((link) => {
			if (hoverLink === link) return;
			hoverLink = link;
			updateHighlight();
		}, 500)
	);

	graph.d3Force('charge')?.strength(-500);
	// graph.linkAutoColorBy(
	// 	(link) =>
	// 		(link.source instanceof GraphMachine || link.source instanceof GraphUser
	// 			? link.source.id
	// 			: null) || ''
	// );
	graph.nodeAutoColorBy(
		(node) =>
			(node instanceof GraphMachine ? node.user?.id : node instanceof GraphUser ? node.id : null) ||
			''
	);

	graph.onNodeDragEnd((node) => {
		if (!opt?.snapBack && typeof node === 'object' && 'x' in node && 'y' in node && 'z' in node) {
			Object.assign(node, {
				fx: node.x,
				fy: node.y,
				fz: node.z
			});
		}
	});

	onMount(() => {
		graph(target);

		if (target.parentElement) observer.observe(target.parentElement);

		return () => {
			observer.disconnect();
			graph._destructor();
		};
	});

	function setTheme(mode: 'dark' | 'light' | undefined) {
		if (!mode || mode === 'dark') {
			graph.backgroundColor('#0a0a0a');
			graph.linkColor(() => '#fff');
		}

		if (mode === 'light') {
			graph.backgroundColor('#fff');
			graph.linkColor(() => '#0a0a0a');
		}
	}

	function updateHighlight() {
		// trigger update of highlighted objects in scene
		graph
			.nodeColor(graph.nodeColor())
			.linkWidth(graph.linkWidth())
			.linkDirectionalParticles(graph.linkDirectionalParticles());
	}
</script>

<div {...$$restProps} bind:this={target}>
	<Spinner />
</div>
