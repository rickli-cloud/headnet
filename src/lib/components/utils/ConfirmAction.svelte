<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { z } from 'zod';

	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import * as Form from '$lib/components/form';
	import { invalidateAll } from '$app/navigation';

	export let title: string;
	export let description: string | undefined = undefined;
	export let isOpen: boolean = false;
	export let submitText: string = 'Continue';
	export let confirm: boolean = true;
	export let confirmText: string = 'I understand that this action can not be undone';
	export let destructive: boolean = confirm;
	export let asChild: boolean = true;
	export let disabled: boolean = false;

	export function open() {
		isOpen = true;
	}

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	const schema = z.object({
		confirm: z.literal(true, {
			errorMap: (issue) => ({ ...issue, message: 'Acknowledgement required to proceed' })
		})
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: false,
		validators: zod(schema),
		onUpdate() {}
	});

	const { form: formData, constraints } = form;
</script>

<AlertDialog.Root bind:open={isOpen}>
	<AlertDialog.Trigger let:builder {asChild} {disabled}>
		<slot name="trigger" {builder} />
	</AlertDialog.Trigger>

	<AlertDialog.Content>
		<AlertDialog.Header class="mb-4">
			<AlertDialog.Title>{title}</AlertDialog.Title>
			{#if description}
				<AlertDialog.Description>{description}</AlertDialog.Description>
			{/if}
		</AlertDialog.Header>

		<slot />

		{#if confirm}
			<Form.Root {form} destructive hasRequired disableControl class="mb-4">
				<Form.Field {form} name="confirm">
					<Form.Control let:attrs>
						<div class="flex flex-row-reverse items-center justify-end gap-2.5">
							<Form.Label for={attrs.id}>{confirmText}</Form.Label>
							<Checkbox
								class="border-current"
								{...attrs}
								{...$constraints.confirm || {}}
								bind:checked={$formData.confirm}
							/>
						</div>
						<Form.FieldErrors />
					</Form.Control>
				</Form.Field>
			</Form.Root>
		{/if}

		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class={destructive ? buttonVariants({ variant: 'destructive' }) : ''}
				disabled={confirm && !$formData.confirm}
				on:click={() => {
					isOpen = false;
					dispatch('submit');
					invalidateAll();
				}}
			>
				{submitText}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
