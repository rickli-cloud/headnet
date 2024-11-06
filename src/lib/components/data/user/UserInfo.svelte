<script lang="ts">
	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';

	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import Secret from '$lib/components/utils/Secret.svelte';

	import { formatDuration, isExpired } from '$lib/utils/time';
	import type { Acl, PreAuthKey, User } from '$lib/api';

	export let user: User;
	export let acl: Acl | undefined;
	export let preAuthKeys: PreAuthKey[] | undefined;

	$: groups = acl?.groups
		.filter((i) => user.name && i.members.includes(user.name))
		.map((group) => group.name);

	$: keys = preAuthKeys?.filter((key) => key.user === user.name) || [];
</script>

<Sheet.Header>
	<Sheet.Title class="flex items-center gap-1.5">
		<Button variant="ghost" class="h-7 w-7 p-1.5">
			<EllipsisVertical class="h-4 w-4" />
		</Button>

		<span>
			{user.name}
		</span>

		{#if user.id}
			<span class="text-muted-foreground">
				#{user.id}
			</span>
		{/if}
	</Sheet.Title>

	<Sheet.Description>
		Created on
		{user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined}
	</Sheet.Description>

	{#if groups?.length}
		<div class="flex flex-wrap items-center gap-1.5">
			{#each groups as group}
				<Badge>{group}</Badge>
			{/each}
		</div>
	{/if}
</Sheet.Header>

<Sheet.Header>
	<Sheet.Title>PreAuth keys</Sheet.Title>
</Sheet.Header>

<div>
	{#each keys || [] as key}
		<div class="space-y-1.5 border-b px-1 py-3 first:pt-0 last:border-none">
			<div class="flex flex-wrap items-center gap-x-1.5 gap-y-2">
				<button class="rounded p-2 hover:bg-muted">
					<EllipsisVertical class="h-4 w-4" />
				</button>

				<Secret class="font-semibold" secret={key.key} />
			</div>

			<div class="flex flex-wrap items-center gap-x-1.5 gap-y-2">
				{#if key.expiration && isExpired(key.expiration)}
					<Badge variant="destructive">
						Expired {new Date(key.expiration).toDateString()}
					</Badge>
				{:else if key.expiration}
					<Badge variant="positive">
						Valid for {formatDuration(Date.now() - new Date(key.expiration).getTime())}
					</Badge>
				{/if}

				{#if key.createdAt}
					<Badge variant="outline">
						Created on {new Date(key.createdAt).toLocaleDateString()}
					</Badge>
				{/if}

				{#if key.used}
					<Badge variant="outline">Used</Badge>
				{/if}

				{#if key.reusable}
					<Badge variant="outline">Reusable</Badge>
				{/if}

				{#if key.ephemeral}
					<Badge variant="outline">Ephemeral</Badge>
				{/if}

				{#if key.aclTags?.length}
					{#each key.aclTags as tag}
						<Badge>{tag}</Badge>
					{/each}
				{/if}
			</div>
		</div>
	{/each}
</div>
