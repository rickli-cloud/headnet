<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';

	import * as Form from '$lib/components/form';

	import type { Acl, AclData, User } from '$lib/api';
	import SelectRuleSource from './SelectRuleSource.svelte';
	import Code from '$lib/components/utils/Code.svelte';

	export let acl: Acl;
	export let users: User[];
	export let rule: AclData['acls'][0];

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	const schema = z.object({
		src: z.array(z.string()),
		dst: z.array(z.string())
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate({ form }) {
			if (form.valid) {
				console.debug('form is valid');
				dispatch('submit');
			}
		}
	});

	const { form: formData, constraints } = form;

	export function reset() {
		formData.set({
			src: rule.src,
			dst: rule.dst.map((dst) => `${dst.host}:${dst.port}`)
		});
	}

	reset();
</script>

<Dialog.Root>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit rule</Dialog.Title>
		</Dialog.Header>

		<Form.Root {form} {reset} submitText="Save">
			<Form.Field {form} name="src">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Source</Form.Label>
					<SelectRuleSource {acl} {users} bind:selected={$formData.src} />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="dst">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Destination</Form.Label>
				</Form.Control>
			</Form.Field>
		</Form.Root>

		<Code yaml={$formData} />
	</Dialog.Content>
</Dialog.Root>
