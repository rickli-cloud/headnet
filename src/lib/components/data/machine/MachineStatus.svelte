<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils/shadcn';

	interface $$Props extends Partial<HTMLDivElement> {
		online: boolean | undefined;
		lastSeen: string | undefined;
	}

	export let online: $$Props['online'];
	export let lastSeen: $$Props['lastSeen'];
</script>

<Tooltip.Root>
	<Tooltip.Trigger asChild let:builder>
		<Button builders={[builder]} class="h-full cursor-default !bg-transparent !p-0" variant="ghost">
			<div
				{...$$restProps}
				class={cn('mx-auto h-2.5 w-2.5 rounded-full', $$restProps.class)}
				class:bg-green-600={online}
				class:bg-red-600={!online}
			></div>
		</Button>
	</Tooltip.Trigger>

	<Tooltip.Content side="right">
		<p>
			Last seen: {lastSeen ? new Date(lastSeen).toLocaleString() : 'unknown'}
		</p>
	</Tooltip.Content>
</Tooltip.Root>
