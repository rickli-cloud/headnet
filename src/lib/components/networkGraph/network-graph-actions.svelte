<script lang="ts">
	import { writable } from 'svelte/store';

	export let isOpen: boolean = false;
	export const offset = writable({ x: 0, y: 0 });
	export const selected = writable<object | undefined>(undefined);

	export const open = (data: object, ev: MouseEvent) => {
		selected.set(data);
		offset.set({ x: ev.pageX, y: ev.pageY });
		isOpen = true;
	};

	export const close = () => {
		isOpen = false;
	};

	export const toggle = () => {
		isOpen = !isOpen;
	};
</script>

{#if isOpen}
	<ul
		class="menu fixed z-50 min-w-64 max-w-96 rounded-lg border bg-background"
		style="
			top: {$offset.y > window.innerHeight / 2 ? 'auto' : $offset.y + 'px'};
			bottom: {$offset.y > window.innerHeight / 2 ? window.innerHeight - $offset.y + 'px' : 'auto'};
			left: {$offset.x > window.innerWidth / 2 ? 'auto' : $offset.x + 'px'};
			right: {$offset.x > window.innerWidth / 2 ? window.innerWidth - $offset.x + 'px' : 'auto'};"
	>
		<slot selected={$selected} />
	</ul>
{/if}
