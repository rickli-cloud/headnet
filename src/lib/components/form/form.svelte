<script lang="ts">
	import type { SuperForm } from 'sveltekit-superforms';
	import type { ClassValue } from 'tailwind-variants';

	import { Button } from '$lib/components/ui/form';

	import { cn } from '$lib/utils/shadcn';

	interface $$Props extends Omit<Partial<HTMLFormElement>, 'children'> {
		form: SuperForm<any, any>;
		reset?: () => void;
		class?: ClassValue;
		disabled?: boolean;
		resetText?: string;
		submitText?: string;
	}

	export let form: $$Props['form'];
	export let reset: $$Props['reset'] = undefined;
	export let disabled: $$Props['disabled'] = undefined;
	export let resetText: $$Props['resetText'] = 'Reset';
	export let submitText: $$Props['submitText'] = 'Submit';
</script>

<form {...$$restProps} class={cn('data-form', $$restProps.class || '')} use:form.enhance on:submit>
	<slot />

	<slot name="controls" {reset} {disabled} {submitText} {resetText}>
		<div class="!space-y-4">
			<div class="star-note">required</div>

			<slot name="buttons" {reset} {disabled} {submitText} {resetText}>
				<div class="grid grid-cols-2 items-end justify-center gap-2">
					{#if typeof reset === 'function'}
						<Button type="button" on:click={reset} {disabled} variant="outline">{resetText}</Button>
					{/if}

					<Button type="submit" class="col-[2]" {disabled}>{submitText}</Button>
				</div>
			</slot>
		</div>
	</slot>
</form>
