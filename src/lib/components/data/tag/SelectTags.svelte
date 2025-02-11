<script lang="ts">
	import type { Selected } from 'bits-ui';
	import { writable } from 'svelte/store';

	import * as Select from '$lib/components/ui/select';

	import { tagRegex, type Policy } from '$lib/api';

	interface $$Props extends Partial<HTMLElement> {
		tags: Policy['tagOwners'] | undefined;
		selected: string[] | undefined;
		required?: boolean;
		/** @default true */
		multiple?: boolean;
	}

	export let tags: $$Props['tags'];
	export let selected: $$Props['selected'];

	const sel = writable<Selected<string | undefined>[]>(
		selected?.map((i) => ({ value: i, label: i })) || []
	);

	sel.subscribe((s) => {
		selected = s.map((i) => i.value).filter((i) => typeof i !== 'undefined');
	});
</script>

<Select.Root {...$$restProps} bind:selected={$sel} multiple>
	<Select.Trigger>
		<Select.Value />
	</Select.Trigger>

	<Select.Content class="!mt-0">
		<Select.Group>
			{#each tags ? Object.keys(tags) : [] as name}
				<Select.Item value={name}>{name?.replace(tagRegex, '')}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
