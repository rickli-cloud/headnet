<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Sheet from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Form from '$lib/components/form';

	import SelectGroups from '$lib/components/data/group/SelectGroups.svelte';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { type Acl, type AclData } from '$lib/api';
	import { formatError } from '$lib/utils/error';

	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let mainSheet: InstanceType<typeof Sheet.Root>;

	const schema: z.ZodType<AclData['tagOwners'][0]> = z.object({
		name: z.string(),
		members: z.array(z.string()),
		comments: z.array(z.string())
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate(ev) {
			if (ev.form.valid && acl) {
				acl.tagOwners.push(ev.form.data);
				try {
					await acl.save();
					successToast(`Created tag "${ev.form.data.name}"`);
					dispatch('submit');
					mainSheet.close();
				} catch (err) {
					console.error(err);
					errorToast(formatError(err));
				}
			}
		}
	});

	const { form: formData } = form;

	const rawComments = writable<string>('');

	rawComments.subscribe((comments) =>
		formData.update((data) => ({
			...data,
			comments: comments.length ? comments.split(/\n{1,}/gm).map((i) => i.trim()) : []
		}))
	);

	function reset() {
		rawComments.set('');
		formData.set({
			name: '',
			members: [],
			comments: []
		});
	}
</script>

<Sheet.Root bind:this={mainSheet}>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Create group</Sheet.Title>
		</Sheet.Header>

		<Form.Root {form} {reset} submitText="Create" hasRequired>
			<Form.Field {form} name="name" let:constraints>
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Name</Form.Label>
					<Input {...attrs} {...constraints || {}} bind:value={$formData.name} />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="members">
				<Form.Control>
					<Label for="user.groups">Owners</Label>
					<SelectGroups groups={acl?.groups} bind:selected={$formData.members} />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="comments">
				<Form.Control>
					<Label for="user.groups">Description</Label>
					<Textarea bind:value={$rawComments} />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Sheet.Content>
</Sheet.Root>
