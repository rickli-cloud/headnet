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

	import { groupRegex, Policy, User } from '$lib/api';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import { HeadscaleClient } from '$lib/store/session';

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
		async onUpdate(ev) {
			if (ev.form.valid) {
				try {
					const res = await User.create($HeadscaleClient, { data: { name: $formData.name } });
					if (res.error) throw res.error;

					if (ev.form.data.groups?.length && policy?.groups) {
						// acl.groups = acl.groups.map((g) =>
						// 	ev.form.data.groups?.includes(g.name)
						// 		? { ...g, members: g.members.concat([ev.form.data.name]) }
						// 		: g
						// );
						const aclRes = await policy.save($HeadscaleClient);
						if (aclRes.error) throw aclRes.error;
					}

					successToast(`Created user "${res.data?.name}"`);
					dispatch('submit');
					mainSheet.close();
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

<Sheet.Root bind:this={mainSheet}>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Create user</Sheet.Title>
		</Sheet.Header>

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
							{#each Object.keys(policy.groups || {}) as name}
								<Select.Item value={name} label={name.replace(groupRegex, '')}>
									{name.replace(groupRegex, '')}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</Form.Root>
	</Sheet.Content>
</Sheet.Root>
