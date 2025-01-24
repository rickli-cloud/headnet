<script lang="ts">
	import type { Acl, Machine } from '$lib/api';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	import Plus from 'lucide-svelte/icons/plus';
	import CreateHost from './CreateHost.svelte';

	export let acl: Acl;
	export let machines: Machine[] | undefined;
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Hosts</Sheet.Title>
		</Sheet.Header>

		<ul class="menu">
			<li>
				<CreateHost {acl}>
					<svelte:fragment slot="trigger" let:builder>
						<button {...builder} use:builder.action>
							<Plus />
							<span> Host </span>
						</button>
					</svelte:fragment>
				</CreateHost>
			</li>
		</ul>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>CIDR</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each acl.hosts || [] as host}
					<Table.Row>
						<Table.Cell>
							{host.name}
						</Table.Cell>

						<Table.Cell>
							{host.cidr}
						</Table.Cell>
					</Table.Row>

					<div>
						{#each host.comments || [] as comment}
							<p>{comment}</p>
						{/each}
					</div>
				{/each}
			</Table.Body>
		</Table.Root>

		<!-- <Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each machines || [] as machine}
					<Table.Row>
						<Table.Cell>
							<button class="link">
								{machine.givenName}
							</button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root> -->

		<slot />
	</Sheet.Content>
</Sheet.Root>
