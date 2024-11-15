<script lang="ts">
	import CircleAlert from 'lucide-svelte/icons/circle-alert';

	import { dev } from '$app/environment';

	import * as Alert from '$lib/components/ui/alert/index.js';

	import { FormError } from '$lib/components/form';

	import { formatStack } from '$lib/utils/error';
	import { cn } from '$lib/utils/shadcn';
	import { ApiError } from '$lib/api';

	import Code from './Code.svelte';

	export let err: any = undefined;
	export let toast: boolean = false;

	console.error(err);
</script>

{#if toast}
	<span class="text-destructive">
		{#if err instanceof ApiError}
			<span class="font-semibold">{err.name}:</span>
		{:else if err instanceof Error}
			<span class="font-semibold">{err.name}:</span>
			{err.message}
		{:else}
			<span class="font-semibold">Internal error</span>
		{/if}
	</span>
{:else}
	<Alert.Root
		variant="destructive"
		class={cn(
			'w-full',
			(!toast && err instanceof Error && !(err instanceof FormError)) ||
				(!(err instanceof ApiError) && dev !== true)
				? 'overflow-x-scroll'
				: ''
		)}
	>
		<CircleAlert class="h-4 w-4" />
		<Alert.Title>
			{#if err instanceof ApiError}
				<span class="font-semibold">{err.name}:</span>
				{#if err.cause?.method && err.cause?.path}
					{err.cause.method}
					{err.cause.path}:
				{/if}
				{err.message}
			{:else if err instanceof Error}
				<span class="font-semibold">{err.name}:</span>
				{err.message}
			{:else}
				<span class="font-semibold">Internal error</span>
			{/if}
		</Alert.Title>

		<Alert.Description>
			{#if toast || err instanceof FormError || (err instanceof ApiError && dev !== true)}
				<div></div>
			{:else if err instanceof Error}
				{#if err.stack}
					<table class="mt-2 table">
						<tbody>
							{#each formatStack(err.stack) as stack}
								<tr>
									<td class="pr-3">{stack[0]}</td>
									<td>{stack[1]}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}

				{#if err.cause}
					<div class="mt-1 flex gap-3">
						<span class="whitespace-nowrap font-sans font-semibold">Caused by:</span>
						<Code yaml={err.cause} />
					</div>
				{/if}
			{:else}
				<Code yaml={err} />
			{/if}
		</Alert.Description>
	</Alert.Root>
{/if}
