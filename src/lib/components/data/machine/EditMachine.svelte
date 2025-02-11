<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import * as Sheet from '$lib/components/ui/sheet';
	import { Input } from '$lib/components/ui/input';

	import * as Form from '$lib/components/form';

	import { User, type Node } from '$lib/api';
	import SelectUser from '../user/SelectUser.svelte';

	export let machine: Node;
	export let users: User[] | undefined;

	const schema = z.object({
		name: z.string(),
		assigned_user: z.string()
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		onUpdate(ev) {
			if (ev.form.valid) {
				console.debug('Form is valid', ev);
			}
		}
	});

	const { constraints, form: formData } = form;

	function reset() {
		formData.set({ name: machine.givenName || '', assigned_user: machine.user?.name || '' });
	}

	reset();
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Edit machine</Sheet.Title>
		</Sheet.Header>

		<Form.Root {form} {reset} submitText="Save" hasRequired>
			<Form.Field {form} name="name">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Given name</Form.Label>
					<Input {...attrs} {...$constraints.name || {}} bind:value={$formData.name} />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="assigned_user" class="required">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Assigned user</Form.Label>
					<SelectUser {users} bind:selected={$formData.assigned_user} />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Sheet.Content>
</Sheet.Root>
