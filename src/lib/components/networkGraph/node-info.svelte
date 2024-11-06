<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { writable } from 'svelte/store';

	export let isOpen: boolean = false;
	export const selected = writable<object | undefined>();

	export const open = (node: object) => {
		selected.set(node);
		isOpen = true;
	};
	export const close = () => {
		isOpen = false;
	};
	export const toggle = () => {
		isOpen = !isOpen;
	};
</script>

<Sheet.Root bind:open={isOpen}>
	<Sheet.Trigger asChild />

	<Sheet.Content>
		<slot selected={$selected} />
	</Sheet.Content>
</Sheet.Root>
