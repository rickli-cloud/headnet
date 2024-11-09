<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';

	import { GraphMachine, GraphUser, type GraphDataLink } from '$lib/utils/networkGraph';

	export let link: GraphDataLink | undefined;
</script>

<Sheet.Header>
	<Sheet.Title>Link</Sheet.Title>
</Sheet.Header>

<table class="basic-table w-full">
	<tbody>
		<tr>
			<td>Source</td>
			{#if link?.source instanceof GraphUser}
				<td>
					<span class="font-semibold">
						{link.source.name}
					</span>
					<span class="text-muted-foreground">
						#{link.source.id}
					</span>
				</td>
				<td></td>
			{:else if link?.source instanceof GraphMachine}
				<td>
					<span class="font-semibold">
						{link.source.givenName || link.source.name}
					</span>
					<span class="text-muted-foreground">
						#{link.source.id}
					</span>
				</td>
				<td>{link.source.ipAddresses?.join(', ')}</td>
			{/if}
		</tr>

		<tr>
			<td>Target</td>
			{#if link?.target instanceof GraphMachine}
				<td>
					<span class="font-semibold">
						{link.target.givenName || link.target.name}
					</span>
					<span class="text-muted-foreground">
						#{link.target.id}
					</span>
				</td>
				<td>{link.target.ipAddresses?.join(', ')}</td>
			{/if}
		</tr>
	</tbody>
</table>

<Sheet.Header>
	<Sheet.Title>Routes</Sheet.Title>
</Sheet.Header>

<table class="basic-table w-full">
	<thead>
		<tr>
			<th>Prefix</th>
			<th>Source</th>
		</tr>
	</thead>
	<tbody>
		{#each link?.routes || [] as route}
			<tr>
				<td>{route.host}:{route.port}</td>
				<td>{route.source}</td>
			</tr>
		{/each}
	</tbody>
</table>
