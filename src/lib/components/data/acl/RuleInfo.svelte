<script lang="ts">
	import type { Policy, User, V1Policy } from '$lib/api';

	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Info from 'lucide-svelte/icons/info';

	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';

	import EditRule from './EditRule.svelte';
	import { createEventDispatcher } from 'svelte';
	import { splitAclDestination } from '$lib/utils/misc';

	export let policy: Policy;
	export let users: User[] | undefined;
	export let rule: V1Policy['acls'][0];
	export let prefixes: { in: Set<string>; out: Set<string> } | undefined = undefined;

	const dispatch = createEventDispatcher<{ close: undefined }>();
</script>

<div class="space-y-3 border-b pb-5 last:border-b-0 [&>div]:space-y-2">
	<div class="grid gap-x-6 gap-y-6 !space-y-0 sm:grid-cols-[1fr,1fr,auto]">
		<div class="space-y-2">
			<!-- <div class="flex items-center justify-between gap-2"></div> -->
			<Label>Source</Label>
			<div class="flex flex-wrap items-center gap-1.5">
				{#each rule.src as src}
					<Badge>{src}</Badge>
				{/each}
			</div>
		</div>

		<div class="space-y-2">
			<Label>Destination</Label>
			<div class="flex flex-wrap items-center gap-1.5">
				{#each rule.dst as dst}
					{@const { host, port } = splitAclDestination(dst)}
					<Badge>{`${host}:${port}`}</Badge>
				{/each}
			</div>
		</div>

		<div>
			<div class="mt-1 flex items-center gap-1.5">
				<EditRule {rule} {policy} {users} on:submit={() => dispatch('close')}>
					<svelte:fragment slot="trigger" let:builder>
						<button
							{...builder}
							use:builder.action
							class="link text-muted-foreground hover:text-current"
						>
							<Settings class="h-5 w-5" />
						</button>
					</svelte:fragment>
				</EditRule>

				<!-- <p class="select-none text-sm text-muted-foreground">|</p> -->

				<button class="link text-muted-foreground hover:text-red-600">
					<Trash class="h-5 w-5" />
				</button>
			</div>
		</div>

		{#if prefixes}
			<div class="space-y-2">
				<div>
					<Label>Routes</Label>

					<Tooltip.Root>
						<Tooltip.Trigger tabindex={-1}>
							<Info class="h-3 w-3" />
						</Tooltip.Trigger>

						<Tooltip.Content side="top" class="space-y-1">
							<div class="flex items-center gap-1.5">
								<ArrowLeft class="h-4 w-4" />
								<span> Incomming </span>
							</div>

							<div class="flex items-center gap-1.5">
								<ArrowRight class="h-4 w-4" />
								<span> Outgoing </span>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>

				<ul class="space-y-0.5">
					{#each prefixes.in as prefix}
						<li class="flex items-center justify-end gap-1.5">
							{prefix}
							<ArrowLeft class="h-4 w-4" />
						</li>
					{/each}
				</ul>
			</div>

			<div class="space-y-2 pt-8">
				<!-- <Label>Routes out</Label> -->

				<ul class="space-y-0.5">
					{#each prefixes.out as prefix}
						<li class="flex items-center gap-1.5">
							<ArrowRight class="h-4 w-4" />
							{prefix}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	<!-- {#if rule.comments?.length}
		<div>
			<Label>Description</Label>
			<div class="space-y-1.5">
				{#each rule.comments as comment}
					<p>{comment}</p>
				{/each}
			</div>
		</div>
	{/if} -->

	<div class="flex items-center gap-1.5 text-[10px] text-muted-foreground">
		#{rule.id}

		<Tooltip.Root>
			<Tooltip.Trigger tabindex={-1}>
				<Info class="h-2.5 w-2.5" />
			</Tooltip.Trigger>

			<Tooltip.Content side="top">
				Randomly generated ID used internally. Does <span class="font-semibold">not persist</span>
				and could change after every page reload.
			</Tooltip.Content>
		</Tooltip.Root>
	</div>
</div>
