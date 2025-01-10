<script lang="ts">
	import type { Selected } from 'bits-ui';
	import { get, writable } from 'svelte/store';

	import * as Select from '$lib/components/ui/select';

	import type { User } from '$lib/api';

	interface $$Props extends Partial<HTMLElement> {
		users: User[] | undefined;
		selected: string[] | undefined;
		required?: boolean;
	}

	export let users: $$Props['users'];
	export let selected: $$Props['selected'];

	const sel = writable<Selected<string>[] | undefined>(
		selected?.map((i) => ({ label: i, value: i }))
	);

	sel.subscribe((s) => (selected = s?.map((i) => i.value)));
</script>

<Select.Root {...$$restProps} bind:selected={$sel} multiple>
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
