<script lang="ts">
	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';

	import Badge from '$lib/components/ui/badge/badge.svelte';

	import Secret from '$lib/components/utils/Secret.svelte';

	import { formatDuration, isExpired } from '$lib/utils/time';
	import type { PreAuthKey } from '$lib/api';

	export let keys: PreAuthKey[] | undefined;
</script>

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
