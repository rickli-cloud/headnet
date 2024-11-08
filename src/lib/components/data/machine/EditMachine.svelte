<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';

	import * as Form from '$lib/components/form';

	import type { Machine } from '$lib/api';

	export let machine: Machine;

	const schema = z.object({
		name: z.string()
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

	formData.set({ name: machine.givenName || '' });

	function reset() {}
</script>

<Dialog.Root>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit machine</Dialog.Title>
		</Dialog.Header>

		<Form.Root {form} {reset} submitText="Save">
			<Form.Field {form} name="name">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Given name</Form.Label>
					<Input {...attrs} {...$constraints.name || {}} bind:value={$formData.name} />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Dialog.Content>
</Dialog.Root>

<!-- <form class="data-form">
	<div>
		<Label for="user.id">Machine key</Label>
		<Input id="user.id" type="password" readonly value={machine.machineKey} />
	</div>

	<div>
		<Label for="user.id">Node key</Label>
		<Input id="user.id" type="password" readonly value={machine.nodeKey} />
	</div>

	<div>
		<Label for="user.id">Disco key</Label>
		<Input id="user.id" type="password" readonly value={machine.discoKey} />
	</div>
</form> -->

<!-- <table class="basic-table w-full overflow-x-scroll">
	<tbody>
		<tr>
			<th>Name</th>
			<td>{machine.name}</td>
		</tr>

		<tr>
			<th>ID</th>
			<td>{machine.id}</td>
		</tr>

		<tr>
			<th>Created</th>
			<td>{machine.createdAt}</td>
		</tr>
	</tbody>
</table> -->
