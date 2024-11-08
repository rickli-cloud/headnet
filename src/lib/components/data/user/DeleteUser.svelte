<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';

	import * as Form from '$lib/components/form';

	import type { User } from '$lib/api';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';

	export let user: User;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let open: boolean;

	const schema = z.object({
		confirm: z.literal(true, {
			errorMap: (issue) => ({ ...issue, message: 'Acknowledgement required to proceed' })
		})
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate(ev) {
			if (ev.form.valid) {
				console.debug('Form is valid', ev);
				// const {} = await user.delete()
				dispatch('submit');
				open = false;
			}
		}
	});

	const { form: formData, constraints } = form;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete user</Dialog.Title>
		</Dialog.Header>

		<Form.Root {form} destructive hasRequired class="mt-4">
			<Form.Field {form} name="confirm">
				<Form.Control let:attrs>
					<div class="flex flex-row-reverse items-center justify-end gap-2.5">
						<Form.Label for={attrs.id}>I understand that this action can not be undone</Form.Label>
						<Checkbox
							class="border-current"
							{...attrs}
							{...$constraints.confirm || {}}
							bind:checked={$formData.confirm}
						/>
					</div>
					<!-- <Input {...attrs} {...$constraints.confirm || {}} bind:value={$formData.confirm} /> -->
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Dialog.Content>
</Dialog.Root>
