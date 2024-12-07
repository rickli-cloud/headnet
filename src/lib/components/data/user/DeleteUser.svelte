<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import type { Acl, User } from '$lib/api';

	export let user: User;
	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	async function deleteUser() {
		try {
			const res = await user.delete();
			if (res.error) throw res.error;

			if (acl?.groups.find((group) => group.members.includes(user.name as string))) {
				acl.groups = acl.groups.map((group) => ({
					...group,
					members: group.members.filter((member) => member !== user.name)
				}));
				const res = await acl.save();
				if (res.error) throw res.error;
			}

			successToast(`Deleted user "${user.name}"`);
			dispatch('submit');
		} catch (err) {
			console.error(err);
			errorToast(formatError(err));
		}
	}
</script>

<ConfirmAction title="Delete user?" on:submit={deleteUser}>
	<svelte:fragment slot="trigger" let:builder>
		<slot name="trigger" {builder} />
	</svelte:fragment>
</ConfirmAction>

<!-- <script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';

	import * as Form from '$lib/components/form';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import type { Acl, User } from '$lib/api';

	export let user: User;
	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let open: boolean;

	const schema = z.object({
		confirm: z.literal(true, {
			errorMap: (issue) => ({ ...issue, message: 'Acknowledgement required to proceed' })
		})
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate(ev) {
			if (ev.form.valid) {
				try {
					const res = await user.delete();
					if (res.error) throw res.error;

					if (acl?.groups.find((group) => group.members.includes(user.name as string))) {
						acl.groups = acl.groups.map((group) => ({
							...group,
							members: group.members.filter((member) => member !== user.name)
						}));
						const res = await acl.save();
						if (res.error) throw res.error;
					}

					successToast(`Deleted user "${user.name}"`);
					dispatch('submit');
					open = false;
				} catch (err) {
					console.error(err);
					errorToast(formatError(err));
				}
			}
		}
	});

	const { form: formData, constraints } = form;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete user</Dialog.Title>
		</Dialog.Header>

		<Form.Root {form} destructive hasRequired class="mt-4" disabled={!$formData.confirm}>
			<Form.Field {form} name="confirm">
				<Form.Control let:attrs>
					<div class="flex flex-row-reverse items-center justify-end gap-2.5">
						<Form.Label for={attrs.id}>I understand that this action can not be undone</Form.Label>
						<Checkbox
							class="border-current"
							{...attrs}
							{...$constraints.confirm || {}}
							bind:checked={$formData.confirm}
						/>
					</div>
					<!-- <Input {...attrs} {...$constraints.confirm || {}} bind:value={$formData.confirm} /> --
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Dialog.Content>
</Dialog.Root>
 -->
