<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Form from '$lib/components/form';

	import { groupRegex, type Acl, type User } from '$lib/api';
	import { createEventDispatcher } from 'svelte';

	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let open: boolean;

	const schema = z.object({
		name: z.string(),
		groups: z.array(z.string()).optional()
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		onUpdate(ev) {
			if (ev.form.valid) {
				console.debug('Form is valid', ev);
				dispatch('submit');
				open = false;
			}
		}
	});

	const { constraints, form: formData } = form;

	const selectedGroups = writable<{ value: string; label: string }[]>([]);

	selectedGroups.subscribe((selected) => {
		formData.update((data) => ({ ...data, groups: selected.map((i) => i.value) }));
	});

	function reset() {
		form.reset({ data: { name: '', groups: [] } });
		selectedGroups.set([]);
	}

	formData.subscribe(console.debug);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create user</Dialog.Title>
		</Dialog.Header>

		<Form.Root {form} {reset} submitText="Create" hasRequired>
			<Form.Field {form} name="name">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Name</Form.Label>
					<Input {...attrs} {...$constraints.name || {}} bind:value={$formData.name} />
				</Form.Control>
			</Form.Field>

			<div>
				<Label for="user.groups">Groups</Label>
				<Select.Root multiple bind:selected={$selectedGroups}>
					<Select.Trigger>
						<Select.Value id="user.groups" />
					</Select.Trigger>

					<Select.Content>
						<Select.Group>
							{#each acl?.groups || [] as group}
								<Select.Item value={group.name} label={group.name.replace(groupRegex, '')}>
									{group.name.replace(groupRegex, '')}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</Form.Root>
	</Dialog.Content>
</Dialog.Root>
