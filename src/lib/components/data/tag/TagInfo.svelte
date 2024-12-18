<script lang="ts">
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';

	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';

	import { tagRegex, type Acl } from '$lib/api';
	import EditTag from './EditTag.svelte';

	export let acl: Acl | undefined;
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
				<button disabled>
					<Plus />
					<span> Create </span>
				</button>
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
				{#each acl?.tagOwners || [] as tag}
					<Table.Row>
						<Table.Cell class="pr-0.5">
							<div class="flex h-6 items-center">
								<EditTag {tag} {acl}>
									<svelte:fragment slot="trigger" let:builder>
										<button
											{...builder}
											use:builder.action
											class="link mr-1.5 text-muted-foreground hover:text-current"
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
								{tag.name?.replace(tagRegex, '')}
							</p>
						</Table.Cell>

						<Table.Cell>
							<div class="flex flex-wrap gap-1.5 py-[1px]">
								{#each tag.members || [] as member}
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
