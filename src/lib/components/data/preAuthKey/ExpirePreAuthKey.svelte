<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import * as Form from '$lib/components/form';

	import type { PreAuthKey } from '$lib/api';

	export let key: PreAuthKey;

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
			}
		}
	});

	const { form: formData, constraints } = form;
</script>

<Dialog.Root>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Expire preAuthKey</Dialog.Title>
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
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Dialog.Content>
</Dialog.Root>
