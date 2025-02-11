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

	import { groupRegex, Policy, type User } from '$lib/api';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import { HeadscaleClient } from '$lib/store/session';

	export let user: User;
	export let policy: Policy;

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
		async onUpdate({ form: { data, valid } }) {
			if (!valid) return;

			try {
				let policyChangesMade: boolean = false;

				// If name changed
				if (user.name && data.name !== user.name) {
					const res = await user.rename($HeadscaleClient, { data: { newName: data.name } });
					if (res.error) throw res.error;

					// Group memberships
					if (policy?.groups) {
						for (const key of Object.keys(policy.groups)) {
							if (policy.groups[key].includes(user.name)) {
								policy.groups[key] = policy.groups[key].map((member) =>
									member === user.name ? data.name : member
								);
								policyChangesMade = true;
							}
						}
					}
				}

				// If groups changed
				if (JSON.stringify(data.groups) !== JSON.stringify(getGroups())) {
					// Add to missing groups
					for (const group of data.groups || []) {
						if (typeof policy.groups === 'undefined') {
							policy.groups = {};
						}
						if (typeof policy.groups[group] === 'undefined') {
							policy.groups[group] = [data.name];
						}
						if (!policy.groups[group].includes(data.name)) {
							policy.groups[group].push(data.name);
						}
					}

					// Remove the unset groups
					for (const key of Object.keys(policy.groups || {})) {
						if (!data.groups?.includes(key) && policy.groups?.[key].includes(data.name)) {
							policy.groups?.[key].filter((i) => i !== data.name);
						}
					}
				}

				if (policyChangesMade) {
					const res = await policy.save($HeadscaleClient);
					if (res.error) throw res.error;
				}

				successToast(`Saved user "${data.name}"`);
				dispatch('submit');
				mainSheet.close();
			} catch (err) {
				console.error(err);
				errorToast(formatError(err));
			}
		}
	});

	const { constraints, form: formData } = form;

	formData.set({ name: user.name || '' });

	function getGroups(): string[] {
		return Object.entries(policy.groups || {})
			.map(([name, members]) => (user.name && members.includes(user.name) ? name : undefined))
			.filter((i) => typeof i !== 'undefined');
	}

	const selectedGroups = writable<{ value: string; label: string }[]>(
		getGroups().map((i) => ({ value: i, label: i }))
	);
	selectedGroups.subscribe((selected) => {
		formData.update((data) => ({ ...data, groups: selected.map((i) => i.value) }));
	});

	function reset() {
		form.reset({ data: { name: user.name, groups: [] } });
		selectedGroups.set(getGroups().map((i) => ({ value: i, label: i })));
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
							{#each Object.keys(policy?.groups || {}) as group}
								<Select.Item value={group} label={group.replace(groupRegex, '')}>
									{group.replace(groupRegex, '')}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</Form.Root>
	</Sheet.Content>
</Sheet.Root>
