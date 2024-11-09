<script lang="ts">
	import { stringify } from 'yaml';

	import * as Sheet from '$lib/components/ui/sheet';

	import { GraphMachine, GraphUser, type GraphDataLink } from '$lib/utils/networkGraph';
	import type { Acl } from '$lib/api';

	export let link: GraphDataLink | undefined;

	const rules = new Set<Acl['acls'][0]>();
	const rulePrefixes: { [x: string]: string[] } = {};

	for (const route of link?.routes || []) {
		if (route.rule) {
			rules.add(route.rule);
			if (!Array.isArray(rulePrefixes[route.rule.id])) rulePrefixes[route.rule.id] = [];
			rulePrefixes[route.rule.id].push(`${route.host}:${route.port}`);
		}
	}
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
			<th>Rule</th>
		</tr>
	</thead>
	<tbody>
		{#each link?.routes || [] as route}
			<tr>
				<td>{route.host}:{route.port}</td>
				<td>
					<pre><code>{stringify(route.rule)}</code></pre>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<div>
	<pre><code
			>{stringify([...rules].map((rule) => ({ ...rule, prefixes: rulePrefixes[rule.id] })))}</code
		></pre>
</div>
