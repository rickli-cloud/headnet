<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Sheet from '$lib/components/ui/sheet';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Form from '$lib/components/form';

	import { Acl, groupRegex, type User } from '$lib/api';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';

	export let user: User;
	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let mainSheet: InstanceType<typeof Sheet.Root>;

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
					// If name changed
					if (user.name && ev.form.data.name !== user.name) {
						const res = await user.rename(ev.form.data.name);
						if (res.error) throw res.error;

						if (acl) {
							acl.groups = acl.groups.map((group) => {
								if (user.name && group.members.includes(user.name)) {
									return {
										...group,
										members: group.members
											.map((member) => (member === group.name ? undefined : member))
											.filter((member) => typeof member !== 'undefined')
											.concat(ev.form.data.name)
									};
								}
								return group;
							});
						}
					}

					// If groups changed
					if (acl && JSON.stringify(ev.form.data.groups) !== JSON.stringify(getGroups())) {
						acl.groups = acl.groups.map((group) => {
							const isInGroup: boolean = group.members.includes(ev.form.data.name);
							const shouldBeInGroup: boolean = ev.form.data.groups?.includes(group.name) || false;

							if (isInGroup && !shouldBeInGroup) {
								return {
									...group,
									members: group.members.filter((member) => member !== ev.form.data.name)
								};
							} else if (shouldBeInGroup && !isInGroup) {
								return {
									...group,
									members: group.members.concat([ev.form.data.name])
								};
							}

							return group;
						});

						const res = await acl.save();
						if (res.error) throw res.error;
					}

					successToast(`Saved user "${ev.form.data.name}"`);
					dispatch('submit');
					mainSheet.close();
				} catch (err) {
					console.error(err);
					errorToast(formatError(err));
				}
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
</script>

<Sheet.Root bind:this={mainSheet}>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Edit user</Sheet.Title>
		</Sheet.Header>

		<Form.Root {form} {reset} submitText="Save" hasRequired>
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
	</Sheet.Content>
</Sheet.Root>
