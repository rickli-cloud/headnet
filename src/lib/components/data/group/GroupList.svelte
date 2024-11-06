<script lang="ts">
	import type { ClassValue } from 'clsx';

	import Badge from '$lib/components/ui/badge/badge.svelte';

	import { groupRegex, type Acl, type User } from '$lib/api';
	import { cn } from '$lib/utils/shadcn';

	interface $$Props extends Partial<HTMLDivElement> {
		user: User;
		acl: Acl | undefined;
		hideGroupTag?: boolean;
		class?: ClassValue;
	}

	export let user: $$Props['user'];
	export let acl: $$Props['acl'];
	export let hideGroupTag: $$Props['hideGroupTag'] = false;

	const groups = acl?.groups
		.filter((i) => user.name && i.members.includes(user.name))
		.map((group) => (hideGroupTag ? group.name.replace(groupRegex, '') : group.name));
</script>

{#if groups?.length}
	<div {...$$restProps} class={cn('flex flex-wrap items-center gap-1.5', $$restProps.class)}>
		{#each groups as group}
			<Badge>{group}</Badge>
		{/each}
	</div>
{/if}
