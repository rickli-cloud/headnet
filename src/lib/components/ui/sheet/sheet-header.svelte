<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/shadcn.js';

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<div class={cn('!mt-8 flex flex-col space-y-2 text-left first:!mt-0', className)} {...$$restProps}>
	<slot />
</div>
