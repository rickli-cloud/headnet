<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	interface $$Props extends Omit<ComponentProps<Dialog.Root>, 'open'> {
		isOpen?: boolean;
	}

	export let isOpen: $$Props['isOpen'] = false;

	export function open() {
		isOpen = true;
	}

	export function close() {
		isOpen = false;
	}
</script>

<Dialog.Root {...$$restProps} bind:open={isOpen} on:open on:closeFocus>
	<slot {open} {close} />
</Dialog.Root>
