<script lang="ts">
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';

	import * as Sheet from '$lib/components/ui/sheet';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	import { groupRegex, type Acl } from '$lib/api';

	export let groups: Acl['groups'] | undefined;
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Groups</Sheet.Title>
			<Sheet.Description>Group together users to ease policy management</Sheet.Description>
		</Sheet.Header>

		<ul class="menu">
			<li>
				<button disabled>
					<Plus />
					<span> Create </span>
				</button>
			</li>
		</ul>

		<div class="space-y-4">
			{#each groups || [] as group}
				<div class="space-y-3 border-b pb-5 last:border-b-0">
					<div class="flex items-center justify-between gap-3">
						<p class="font-semibold">
							{group.name?.replace(groupRegex, '')}
						</p>

						<div class="flex items-center gap-1.5">
							<button class="link text-muted-foreground hover:text-current">
								<Settings class="h-5 w-5" />
							</button>

							<button class="link text-muted-foreground hover:text-red-600">
								<Trash class="h-5 w-5" />
							</button>
						</div>
					</div>

					<div class="flex gap-1.5">
						{#each group.members as member}
							<Badge>
								{member}
							</Badge>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<slot />
	</Sheet.Content>
</Sheet.Root>
