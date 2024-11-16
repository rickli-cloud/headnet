<script lang="ts">
	import type { AclData } from '$lib/api';

	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';

	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';

	export let rule: AclData['acls'][0];
	export let prefixes: { in: Set<string>; out: Set<string> };
</script>

<div class="space-y-3 border-b pb-5 last:border-b-0 [&>div]:space-y-2">
	<div>
		<div class="flex items-center justify-between gap-2">
			<Label>Source</Label>
			<div class="flex items-center gap-1.5">
				<button class="link text-muted-foreground hover:text-current">
					<!-- Edit -->
					<Settings class="h-5 w-5" />
				</button>

				<!-- <p class="select-none text-sm text-muted-foreground">|</p> -->

				<button class="link destructive text-muted-foreground hover:text-current">
					<!--  Delete  -->
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
		<Label>Target</Label>
		<div class="flex items-center gap-1.5">
			{#each rule.dst as dst}
				<Badge>{`${dst.host}:${dst.port}`}</Badge>
			{/each}
		</div>
	</div>

	<div>
		<Label>Routes</Label>
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

	{#if rule.comments?.length}
		<div class="space-y-1.5">
			{#each rule.comments as comment}
				<p>{comment}</p>
			{/each}
		</div>
	{/if}
</div>
