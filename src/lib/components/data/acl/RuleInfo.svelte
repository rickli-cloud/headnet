<script lang="ts">
	import type { Acl, AclData, User } from '$lib/api';

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

	export let acl: Acl;
	export let users: User[] | undefined;
	export let rule: AclData['acls'][0];
	export let prefixes: { in: Set<string>; out: Set<string> } | undefined = undefined;

	const dispatch = createEventDispatcher<{ close: undefined }>();
</script>

<div class="space-y-3 border-b pb-5 last:border-b-0 [&>div]:space-y-2">
	<div>
		<div class="flex items-center justify-between gap-2">
			<Label>Source</Label>
			<div class="flex items-center gap-1.5">
				<EditRule {rule} {acl} {users} on:submit={() => dispatch('close')}>
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
		<div class="flex items-center gap-1.5">
			{#each rule.src as src}
				<Badge>{src}</Badge>
			{/each}
		</div>
	</div>

	<div>
		<Label>Destination</Label>
		<div class="flex items-center gap-1.5">
			{#each rule.dst as dst}
				<Badge>{`${dst.host}:${dst.port}`}</Badge>
			{/each}
		</div>
	</div>

	{#if prefixes}
		<div class="!mt-4">
			<Label class="flex items-center gap-1.5">
				Routes
				<Tooltip.Root>
					<Tooltip.Trigger tabindex={-1}>
						<Info class="h-3.5 w-3.5" />
					</Tooltip.Trigger>

					<Tooltip.Content side="right">
						<div class="grid grid-cols-2 items-center gap-x-1 gap-y-0.5">
							<ArrowLeft class="h-4 w-4" />
							<p>In</p>

							<ArrowRight class="h-4 w-4" />
							<p>Out</p>
						</div>
					</Tooltip.Content>
				</Tooltip.Root>
			</Label>

			<ul class="space-y-0.5">
				{#each [...prefixes.in]
					.map((prefix) => ({ prefix, direction: 'in' }))
					.concat([...prefixes.out].map((prefix) => ({ prefix, direction: 'out' }))) as prefix}
					<li class="flex items-center gap-1.5">
						{#if prefix.direction === 'in'}
							<ArrowLeft class="h-4 w-4" />
						{:else if prefix.direction === 'out'}
							<ArrowRight class="h-4 w-4" />
						{/if}
						{prefix.prefix}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if rule.comments?.length}
		<div>
			<Label>Description</Label>
			<div class="space-y-1.5">
				{#each rule.comments as comment}
					<p>{comment}</p>
				{/each}
			</div>
		</div>
	{/if}

	<div class="text-[10px] text-muted-foreground">
		#{rule.id}
	</div>
</div>
