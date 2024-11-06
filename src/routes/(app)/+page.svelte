<script lang="ts">
	import { writable } from 'svelte/store';
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
	import { formatGraphData } from '$lib/utils/networkGraph.js';

	export let data;

	const graphData = writable<GraphData>(formatGraphData(data));

	graphData.subscribe((d) => console.debug({ nodes: d.nodes.length, links: d.links.length }));

	const preAuthKeys = writable<PreAuthKey[]>([]);

	preAuthKeys.subscribe(console.debug);

	onMount(async () => {
		preAuthKeys.set(await PreAuthKey.list(data.users || []));
	});
</script>

<main class="relative overflow-x-hidden overflow-y-hidden">
	<NetworkGraph {graphData}>
		<svelte:fragment slot="node-info" let:selected>
			{#if selected instanceof Machine}
				<MachineInfo machine={selected} routes={data.routes} />
			{:else if selected instanceof User}
				<UserInfo user={selected} acl={data.acl} preAuthKeys={$preAuthKeys} />
			{:else if selected && 'nodeId' in selected && selected.nodeId === 1}
				<Sheet.Header>
					<Sheet.Title>Internet</Sheet.Title>
				</Sheet.Header>
			{:else}
				<div class="text-red-600">Not found</div>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="node-actions" let:nodeActions let:selected>
			{#if selected instanceof User}
				<UserActions user={selected} on:close={nodeActions.close} />
			{:else if selected instanceof Machine}
				<MachineActions machine={selected} on:close={nodeActions.close} />
			{:else if selected && 'nodeId' in selected && selected.nodeId === 1}
				<InternetActions on:close={nodeActions.close} />
			{:else}
				<div class="text-red-600">Not found</div>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="page-actions" let:pageActions>
			<PageActions on:close={pageActions.close} />
		</svelte:fragment>
	</NetworkGraph>
</main>
