<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';

	import * as Form from '$lib/components/form';

	import { tagRegex, type Acl, type AclData } from '$lib/api';
	import Input from '$lib/components/ui/input/input.svelte';
	import SelectGroups from '../group/SelectGroups.svelte';
	import { writable } from 'svelte/store';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	export let acl: Acl | undefined;
	export let tag: Acl['tagOwners'][0] | undefined;
	export let type: 'Edit' | 'delete' = 'Edit';

	const schema: z.ZodType<Acl['tagOwners'][0]> = z.object({
		name: z.string(),
		members: z.array(z.string()),
		comments: z.array(z.string()).optional()
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		onUpdate(ev) {
			if (ev.form.valid) {
			}
		}
	});

	const { constraints, form: formData } = form;

	const description = writable<string | undefined>();

	description.subscribe((desc) => {
		formData.update((data) => ({
			...data,
			comments: desc?.length ? desc?.split(/\n{1,}/gm) : undefined
		}));
	});

	function reset() {
		formData.set({
			name: tag?.name.replace(tagRegex, '') || '',
			members: tag?.members || [],
			comments: tag?.comments || []
		});

		description.set(tag?.comments?.join('\n\n'));
	}

	if (tag) reset();
</script>

<Dialog.Root>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{type} tag</Dialog.Title>
		</Dialog.Header>

		<Form.Root {form} {reset} submitText="Save" hasRequired>
			<Form.Field {form} name="name">
				<Form.Control let:attrs>
					<Form.Label>Name</Form.Label>

					<Input {...attrs} {...$constraints.name} bind:value={$formData.name} />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="members">
				<Form.Control let:attrs>
					<Form.Label>Owners</Form.Label>

					<SelectGroups
						{...attrs}
						{...$constraints.members}
						groups={acl?.groups}
						bind:selected={$formData.members}
					/>
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="comments">
				<Form.Control let:attrs>
					<Form.Label>Description</Form.Label>

					<Textarea {...attrs} {...$constraints.comments} bind:value={$description} />
				</Form.Control>
			</Form.Field>
		</Form.Root>

		<slot />
	</Dialog.Content>
</Dialog.Root>
