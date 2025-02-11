<script lang="ts">
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';

	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';

	import { Policy, tagRegex } from '$lib/api';
	import EditTag from './EditTag.svelte';
	import CreateTag from './CreateTag.svelte';

	export let policy: Policy;
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Tags</Sheet.Title>
			<Sheet.Description>Control tag ownership</Sheet.Description>
		</Sheet.Header>

		<ul class="menu">
			<li>
				<CreateTag {policy}>
					<svelte:fragment slot="trigger" let:builder>
						<button {...builder} use:builder.action>
							<Plus />
							<span> Tag </span>
						</button>
					</svelte:fragment>
				</CreateTag>
			</li>
		</ul>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-10"></Table.Head>
					<Table.Head>Tag</Table.Head>
					<Table.Head>Owners</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each Object.keys(policy.tagOwners || {}) as tag}
					<Table.Row>
						<Table.Cell class="pr-0.5">
							<div class="flex h-6 items-center gap-x-2">
								<EditTag {tag} {policy}>
									<svelte:fragment slot="trigger" let:builder>
										<button
											{...builder}
											use:builder.action
											class="link text-muted-foreground hover:text-current"
										>
											<Settings class="h-4 w-4" />
										</button>
									</svelte:fragment>
								</EditTag>

								<button class="link text-muted-foreground hover:text-red-600">
									<Trash class="h-4 w-4" />
								</button>
							</div>
						</Table.Cell>

						<Table.Cell>
							<p class="h-6 whitespace-nowrap font-semibold" style="line-height: 24px;">
								{tag?.replace(tagRegex, '')}
							</p>
						</Table.Cell>

						<Table.Cell>
							<div class="flex flex-wrap gap-1.5 py-[1px]">
								{#each policy.tagOwners?.[tag] || [] as member}
									<Badge>
										{member}
									</Badge>
								{/each}
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<slot />
	</Sheet.Content>
</Sheet.Root>
