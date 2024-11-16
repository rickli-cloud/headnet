<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Form from '$lib/components/form';

	import { groupRegex, User, Acl } from '$lib/api';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';

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
		async onUpdate(ev) {
			if (ev.form.valid) {
				try {
					const res = await User.create(ev.form.data.name);
					if (res.error) throw res.error;

					if (ev.form.data.groups?.length && acl?.groups) {
						acl.groups = acl.groups.map((g) =>
							ev.form.data.groups?.includes(g.name)
								? { ...g, members: g.members.concat([ev.form.data.name]) }
								: g
						);
						const aclRes = await acl.save();
						if (aclRes.error) throw aclRes.error;
					}

					successToast(`Created user "${res.data?.name}"`);
					dispatch('submit');
					open = false;
				} catch (err) {
					console.error(err);
					errorToast(formatError(err));
				} finally {
					selectedGroups.set([]);
				}
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
