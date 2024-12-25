<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { get, writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Select from '$lib/components/ui/select/index.js';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';

	import * as Form from '$lib/components/form';

	import type { Acl, AclData, User } from '$lib/api';

	import SelectRuleSource from './SelectRuleSource.svelte';
	import SelectRuleTarget from './SelectRuleTarget.svelte';

	export let acl: Acl;
	export let users: User[];
	export let rule: AclData['acls'][0];

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	const schema: z.ZodType<Omit<AclData['acls'][0], 'id'>> = z.object({
		action: z.literal('accept'),
		src: z.array(z.string()),
		dst: z.array(z.object({ host: z.string(), port: z.string() })),
		comments: z.array(z.string()).default([])
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate({ form }) {
			if (form.valid) {
				console.debug('form is valid');
				dispatch('submit');
			}
		}
	});

	const { form: formData, constraints } = form;

	const description = writable<string>(rule.comments?.join('\n') || '');

	description.subscribe((desc) => {
		formData.update((data) => ({ ...data, comments: desc.split(/\n{1,}/gm) }));
	});

	export function reset() {
		formData.set({
			action: 'accept',
			src: rule.src,
			dst: rule.dst,
			comments: get(description).split(/\n{2,}/gm)
		});
	}

	reset();
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Edit rule</Sheet.Title>
		</Sheet.Header>

		<Form.Root {form} {reset} submitText="Save">
			<Form.Field {form} name="action">
				<Form.Control let:attrs>
					<Form.Label>Action</Form.Label>

					<Select.Root selected={{ label: 'accept', value: 'accept' }}>
						<Select.Trigger>
							<Select.Value />
						</Select.Trigger>

						<Select.Content class="!mt-0">
							<Select.Group>
								<Select.Item value="accept">accept</Select.Item>
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="src">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Source</Form.Label>

					<SelectRuleSource {...attrs} {acl} {users} bind:selected={$formData.src} />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="dst">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Destination</Form.Label>

					<SelectRuleTarget {...attrs} {acl} {users} bind:selected={$formData.dst} />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="comments">
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Description</Form.Label>

					<Textarea {...attrs} {...$constraints.comments} bind:value={$description} />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Sheet.Content>
</Sheet.Root>
