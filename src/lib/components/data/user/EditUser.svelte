<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Form from '$lib/components/form';

	import { groupRegex, type Acl, type User } from '$lib/api';

	export let user: User;
	export let acl: Acl | undefined;

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
			}
		}
	});

	const { constraints, form: formData } = form;

	formData.set({ name: user.name || '' });

	function getGroups() {
		return (
			acl?.groups
				.filter((i) => user.name && i.members.includes(user.name))
				.map((group) => ({ value: group.name, label: group.name.replace(groupRegex, '') })) || []
		);
	}

	const selectedGroups = writable<{ value: string; label: string }[]>(getGroups());

	selectedGroups.subscribe((selected) => {
		formData.update((data) => ({ ...data, groups: selected.map((i) => i.value) }));
	});

	function reset() {
		form.reset({ data: { name: user.name, groups: [] } });
		selectedGroups.set(getGroups());
	}

	formData.subscribe(console.debug);
</script>

<Form.Root {form} {reset} submitText="Save">
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Form.Label for={attrs.id}>Name</Form.Label>
			<Input {...attrs} {...$constraints.name || {}} bind:value={$formData.name} />
		</Form.Control>
	</Form.Field>

	<div>
		<Label for="user.id">ID</Label>
		<Input id="user.id" readonly value={user.id} />
	</div>

	<div>
		<Label for="user.created">Created</Label>
		<Input
			id="user.created"
			readonly
			type="datetime-local"
			value={user.createdAt ? new Date(user.createdAt).toISOString().replace(/z$/i, '') : ''}
		/>
	</div>

	<div>
		<Label for="user.groups">Groups</Label>
		<Select.Root multiple bind:selected={$selectedGroups}>
			<Select.Trigger>
				<Select.Value id="user.groups" />
			</Select.Trigger>

			<Select.Content>
				<Select.Group>
					<Select.Label>Groups</Select.Label>

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
