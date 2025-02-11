<script lang="ts">
	import type { Selected } from 'bits-ui';
	import { writable } from 'svelte/store';

	import * as Select from '$lib/components/ui/select';

	import type { Policy } from '$lib/api';

	export let groups: Policy['groups'] | undefined;
	export let selected: string[] | undefined;

	const sel = writable<Selected<string>[]>(
		selected ? selected.map((s) => ({ label: s, value: s })) : []
	);

	sel.subscribe((s) => (selected = s.map(({ value }) => value)));
</script>

<Select.Root bind:selected={$sel} required multiple>
	<Select.Trigger>
		<Select.Value />
	</Select.Trigger>

	<Select.Content class="!mt-0">
		<Select.Group>
			{#each Object.keys(groups || {}) as group}
				<Select.Item value={group}>{group}</Select.Item>
			{/each}
		</Select.Group>

		<Select.Group>
			{#each selected?.filter((s) => !Object.keys(groups || {}).find((g) => g === s)) || [] as invalid}
				<Select.Item value={invalid} class="!text-red-600">{invalid}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
