<script lang="ts">
	import type { Selected } from 'bits-ui';
	import { writable } from 'svelte/store';

	import * as Select from '$lib/components/ui/select';

	import type { User } from '$lib/api';

	export let users: User[] | undefined;
	export let selected: string | undefined;

	const sel = writable<Selected<string | undefined>>({ value: selected, label: selected });

	sel.subscribe(({ value }) => (selected = value));
</script>

<Select.Root bind:selected={$sel} required>
	<Select.Trigger>
		<Select.Value />
	</Select.Trigger>

	<Select.Content class="!mt-0">
		<Select.Group>
			{#each users || [] as user}
				<Select.Item value={user.name}>{user.name}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
