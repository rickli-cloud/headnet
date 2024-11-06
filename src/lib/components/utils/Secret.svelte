<script lang="ts">
	import { writable } from 'svelte/store';

	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils/shadcn';

	interface $$Props extends Partial<HTMLDivElement> {
		secret: string | undefined;
		class?: ClassValue;
	}

	export let secret: $$Props['secret'];

	const visible = writable<boolean>(false);
</script>

{#if secret}
	<div {...$$restProps} class={cn('flex h-5 items-center gap-2', $$restProps.class)}>
		<button on:click={() => visible.set(!$visible)}>
			{#if $visible}
				<EyeOff class="!h-4 w-4" />
			{:else}
				<Eye class="!h-4 w-4" />
			{/if}
		</button>

		{#if $visible}
			<span class="text-sm">
				{secret}
			</span>
		{:else}
			<span style="font-size: 1.125rem; line-height: 10px; padding-top: 6px;">
				{secret?.replaceAll(/./g, '*')}
			</span>
		{/if}
	</div>
{:else}
	<slot name="undefined">
		<span>{undefined}</span>
	</slot>
{/if}
