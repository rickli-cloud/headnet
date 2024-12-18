<script lang="ts">
	import type { SuperForm } from 'sveltekit-superforms';
	import type { ClassValue } from 'tailwind-variants';

	import { Button } from '$lib/components/ui/form';
	import Code from '$lib/components/utils/Code.svelte';

	import { cn } from '$lib/utils/shadcn';
	import { dev } from '$app/environment';

	interface $$Props extends Omit<Partial<HTMLFormElement>, 'children'> {
		form: SuperForm<any, any>;
		reset?: () => void;
		class?: ClassValue;
		disabled?: boolean;
		resetText?: string;
		submitText?: string;
		destructive?: boolean;
		hasRequired?: boolean;
		disableControl?: boolean;
	}

	export let form: $$Props['form'];
	export let reset: $$Props['reset'] = undefined;
	export let disabled: $$Props['disabled'] = undefined;
	export let resetText: $$Props['resetText'] = 'Reset';
	export let submitText: $$Props['submitText'] = 'Submit';
	export let destructive: $$Props['destructive'] = false;
	export let hasRequired: $$Props['hasRequired'] = false;
	export let disableControl: $$Props['disableControl'] = false;

	const { form: formData, errors } = form;
</script>

<form {...$$restProps} class={cn('data-form', $$restProps.class || '')} use:form.enhance on:submit>
	<slot />

	<!-- {#if dev}
		<div class="rounded bg-muted px-4 py-2 text-muted-foreground">
			<Code yaml={{ errors: $errors, data: $formData }} />
		</div>
	{/if} -->

	<div class="star-note" class:required={hasRequired}>required</div>

	{#if !disableControl}
		<slot name="controls" {reset} {disabled} {submitText} {resetText}>
			<div class="!space-y-4">
				<slot name="buttons" {reset} {disabled} {submitText} {resetText}>
					<div class="grid grid-cols-2 items-end justify-center gap-2">
						{#if typeof reset === 'function'}
							<Button type="button" on:click={reset} {disabled} variant="outline">
								{resetText}
							</Button>
						{/if}

						<Button
							variant={destructive ? 'destructive' : 'default'}
							type="submit"
							class="col-[2]"
							{disabled}
						>
							{submitText}
						</Button>
					</div>
				</slot>
			</div>
		</slot>
	{/if}
</form>
