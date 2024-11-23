<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';

	import * as Form from '$lib/components/form';

	import { User, type Machine } from '$lib/api';
	import Label from '$lib/components/ui/label/label.svelte';
	import SelectUser from '../user/SelectUser.svelte';
	import { writable } from 'svelte/store';

	export let machine: Machine;
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

<Dialog.Root>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit machine</Dialog.Title>
		</Dialog.Header>

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
