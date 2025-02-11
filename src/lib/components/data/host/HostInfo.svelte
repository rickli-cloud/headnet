<script lang="ts">
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';
	import Info from 'lucide-svelte/icons/info';

	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';

	import type { Policy, Node } from '$lib/api';

	import CreateHost from './CreateHost.svelte';

	export let policy: Policy;
	export let machines: Node[] | undefined;
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
				<CreateHost {policy}>
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
					<Table.Head class="w-10"></Table.Head>
					<Table.Head>Name</Table.Head>
					<Table.Head>CIDR</Table.Head>
					<Table.Head>Description</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each Object.keys(policy.hosts || {}) as host}
					<Table.Row>
						<Table.Cell class="pr-0">
							<div class="flex h-6 items-center gap-x-2">
								<!-- {#if host.comments?.length}
									<Tooltip.Root>
										<Tooltip.Trigger
											class="link text-muted-foreground hover:text-current"
											tabindex={-1}
										>
											<Info class="h-4 w-4" />
										</Tooltip.Trigger>

										<Tooltip.Content side="top">
											{#each host.comments as comment}
												<p>{comment}</p>
											{/each}
										</Tooltip.Content>
									</Tooltip.Root>
								{/if} -->

								<button class="link text-muted-foreground hover:text-current">
									<Settings class="h-4 w-4" />
								</button>

								<button class="link text-muted-foreground hover:text-red-600">
									<Trash class="h-4 w-4" />
								</button>
							</div>
						</Table.Cell>

						<Table.Cell>
							{host}
						</Table.Cell>

						<Table.Cell>
							{policy.hosts?.[host]}
						</Table.Cell>

						<Table.Cell>
							<!-- {#each host.comments || [] as comment}
								<p>{comment}</p>
							{/each} -->
						</Table.Cell>
					</Table.Row>
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
