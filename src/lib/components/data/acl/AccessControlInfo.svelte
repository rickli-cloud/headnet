<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';

	import type { Acl, User } from '$lib/api';
	import RuleInfo from './RuleInfo.svelte';
	import Plus from 'lucide-svelte/icons/plus';

	export let acl: Acl;
	export let users: User[] | undefined;
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Access control</Sheet.Title>
		</Sheet.Header>

		<ul class="menu">
			<li>
				<button disabled>
					<Plus />
					<span> Rule </span>
				</button>
			</li>
		</ul>

		<div class="!mt-8 space-y-4">
			{#each acl?.acls || [] as rule}
				<RuleInfo {acl} {users} {rule} />
			{/each}
		</div>

		<slot />
	</Sheet.Content>
</Sheet.Root>
