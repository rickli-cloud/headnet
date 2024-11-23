<script lang="ts">
	import type { Selected } from 'bits-ui';
	import { writable } from 'svelte/store';

	import * as Select from '$lib/components/ui/select/index.js';

	export let items: { [group: string]: string[] };
	export let selected: string;
	export let placeholder: string = 'Select';

	const sel = writable<Selected<string>>({ label: selected, value: selected });

	sel.subscribe(({ value }) => {
		selected = value;
	});
</script>

<Select.Root bind:selected={$sel}>
	<Select.Trigger>
		<Select.Value {placeholder} />
	</Select.Trigger>

	<Select.Content>
		{#each Object.keys(items) as group}
			<Select.Group>
				<Select.Label>{group}</Select.Label>

				{#each items[group] || [] as item}
					<Select.Item value={item}>{item}</Select.Item>
				{/each}
			</Select.Group>
		{/each}

		{#if selected.length && !Object.values(items).find((i) => i.includes(selected))?.length}
			<Select.Group>
				<Select.Label>Unknown</Select.Label>
				<Select.Item value={selected}>{selected}</Select.Item>
			</Select.Group>
		{/if}

		<slot />
	</Select.Content>
</Select.Root>
