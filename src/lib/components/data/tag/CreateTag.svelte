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
	import { tagRegex, type Policy } from '$lib/api';
	import { formatError } from '$lib/utils/error';
	import { HeadscaleClient } from '$lib/store/session';

	export let policy: Policy;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let mainSheet: InstanceType<typeof Sheet.Root>;

	const schema = z.object({
		name: z.string(),
		members: z.array(z.string()),
		comments: z.array(z.string())
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate({ form: { valid, data } }) {
			if (!valid) return;
			try {
				if (!policy.tagOwners) policy.tagOwners = {};

				policy.tagOwners[tagRegex.test(data.name) ? data.name : 'tag:' + data.name] = data.members;

				const { error } = await policy.save($HeadscaleClient);
				if (error) throw error;

				successToast(`Created tag "${data.name}"`);
				dispatch('submit');
				mainSheet.close();
			} catch (err) {
				console.error(err);
				errorToast(formatError(err));
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
					<SelectGroups groups={policy.groups} bind:selected={$formData.members} />
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
