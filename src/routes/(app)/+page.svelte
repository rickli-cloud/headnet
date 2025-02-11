<script lang="ts">
	import ForceGraph3D from '3d-force-graph';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	import X from 'lucide-svelte/icons/x';

	import * as Sheet from '$lib/components/ui/sheet';

	import InternetActions from '$lib/components/data/internet/InternetActions.svelte';
	import MachineActions from '$lib/components/data/machine/MachineActions.svelte';
	import MachineStatus from '$lib/components/data/machine/MachineStatus.svelte';
	import MachineInfo from '$lib/components/data/machine/MachineInfo.svelte';
	import PageActions from '$lib/components/data/page/PageActions.svelte';
	import UserActions from '$lib/components/data/user/UserActions.svelte';
	import UserInfo from '$lib/components/data/user/UserInfo.svelte';
	import LinkInfo from '$lib/components/data/link/LinkInfo.svelte';

	import { NetworkGraph, NetworkGraphActions } from '$lib/components/networkGraph';

	import { Node, PreAuthKey, User } from '$lib/api';
	import { errorToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import {
		focusOnNode,
		formatGraphData,
		GraphDataLink,
		GraphMachine,
		GraphUser,
		type GraphData
	} from '$lib/utils/networkGraph';
	import { page } from '$app/stores';

	import type { PageData } from './$types';

	export let data;

	console.table({ data });

	let nodeInfo: Sheet.Root;
	let linkInfo: Sheet.Root;
	let nodeActions: NetworkGraphActions;
	let pageActions: NetworkGraphActions;

	const graph = ForceGraph3D({});

	const graphData = writable<GraphData>();
	graphData.subscribe(graph.graphData);

	graphData.subscribe((d) => console.debug({ nodes: d?.nodes.length, links: d?.links.length }));

	const preAuthKeys = writable<PreAuthKey[]>([]);

	page.subscribe(async ({ data }) => {
		for (const err of data.errors || []) errorToast(formatError(err));
		graphData.set(formatGraphData(data as PageData));
		// preAuthKeys.set(await PreAuthKey.find(data.users || []));
		preAuthKeys.set([]);
	});

	const selectedNode = writable<object | undefined>(undefined);
	const selectedLink = writable<GraphDataLink | undefined>(undefined);

	function closeEveryPopup(): void {
		nodeActions.close();
		pageActions.close();
		selectedLink.set(undefined);
		selectedNode.set(undefined);
	}

	graph.onBackgroundClick(closeEveryPopup);
	graph.onBackgroundRightClick((ev) => {
		closeEveryPopup();
		pageActions.open(ev);
	});

	graph.onNodeDrag(closeEveryPopup);
	graph.onNodeClick((node, ev) => {
		closeEveryPopup();
		selectedNode.set(node);
		nodeInfo.open();
	});
	graph.onNodeRightClick(async (node, ev) => {
		closeEveryPopup();
		selectedNode.set(node);
		nodeActions.open(ev);
	});

	graph.onLinkClick((link, ev) => {
		if (
			link &&
			'source' in link &&
			'target' in link &&
			link.source instanceof GraphMachine &&
			(link.target instanceof GraphMachine ||
				(link.target &&
					typeof link.target === 'object' &&
					'nodeId' in link.target &&
					link.target?.nodeId === 1))
		) {
			closeEveryPopup();
			selectedLink.set(link as GraphDataLink);
			linkInfo.open();
		}
	});
	graph.onLinkRightClick(closeEveryPopup); // TODO: some actions

	onMount(async () => {
		// preAuthKeys.set(await PreAuthKey.list(data.users || []));
		preAuthKeys.set([]);
		for (const err of data.errors || []) errorToast(formatError(err));
	});
</script>

<main class="relative overflow-x-hidden overflow-y-hidden">
	<NetworkGraph {graph} />
</main>

<Sheet.Root bind:this={nodeInfo} let:close>
	<Sheet.Content>
		{#if $selectedNode instanceof GraphUser}
			<UserInfo
				{...data}
				user={$selectedNode}
				preAuthKeys={$preAuthKeys}
				on:close={close}
				on:focus={() => {
					focusOnNode(graph, $selectedNode);
					close();
				}}
			/>
		{:else if $selectedNode instanceof GraphMachine}
			{#key $graphData.links}
				<MachineInfo
					machine={$selectedNode}
					links={$graphData.links}
					{...data}
					on:close={close}
					on:focus={() => {
						focusOnNode(graph, $selectedNode);
						close();
					}}
				/>
			{/key}
		{:else if $selectedNode && 'nodeId' in $selectedNode && $selectedNode.nodeId === 1}
			<Sheet.Header>
				<Sheet.Title>Internet</Sheet.Title>
			</Sheet.Header>
		{:else}
			<div class="text-red-600">Node not found</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>

<NetworkGraphActions bind:this={nodeActions}>
	{#if $selectedNode instanceof User}
		<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
			<div>
				<span>{$selectedNode?.name}</span>
				<span class="text-muted-foreground">#{$selectedNode?.id}</span>
			</div>

			<button class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted" on:click={nodeActions.close}>
				<X class="h-4 w-4" />
			</button>
		</div>
		<hr />

		{#key $selectedNode}
			<UserActions
				{...data}
				user={$selectedNode}
				on:close={nodeActions.close}
				on:focus={() => {
					focusOnNode(graph, $selectedNode);
					nodeActions.close();
				}}
			/>
		{/key}
	{:else if $selectedNode instanceof Node}
		<div class="grid items-center gap-2" style="grid-template-columns: auto 1fr auto;">
			<MachineStatus online={$selectedNode?.online} lastSeen={$selectedNode?.lastSeen} />

			<div>
				<span>{$selectedNode?.givenName}</span>
				<span class="text-muted-foreground">#{$selectedNode?.id}</span>
			</div>

			<button class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted" on:click={nodeActions.close}>
				<X class="h-4 w-4" />
			</button>
		</div>
		<hr />

		{#key $selectedNode}
			<MachineActions
				machine={$selectedNode}
				users={data.users}
				on:close={nodeActions.close}
				on:focus={() => {
					focusOnNode(graph, $selectedNode);
					nodeActions.close();
				}}
			/>
		{/key}
	{:else if $selectedNode && 'nodeId' in $selectedNode && $selectedNode.nodeId === 1}
		<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
			<span>Internet</span>
			<button class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted" on:click={nodeActions.close}>
				<X class="h-4 w-4" />
			</button>
		</div>
		<hr />

		<InternetActions on:close={nodeActions.close} />
	{:else}
		<div class="text-red-600">Node not found</div>
	{/if}
</NetworkGraphActions>

<NetworkGraphActions bind:this={pageActions}>
	<PageActions on:close={pageActions.close} {...data} />
</NetworkGraphActions>

<Sheet.Root bind:this={linkInfo} let:close>
	<Sheet.Content>
		<LinkInfo {...data} link={$selectedLink} {graph} {close} />
	</Sheet.Content>
</Sheet.Root>
