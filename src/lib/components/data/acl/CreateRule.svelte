<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Select from '$lib/components/ui/select/index.js';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';

	import * as Form from '$lib/components/form';

	import type { Acl, AclData, User } from '$lib/api';

	import SelectRuleSource from './SelectRuleSource.svelte';
	import SelectRuleTarget from './SelectRuleTarget.svelte';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';

	export let acl: Acl;
	export let users: User[] | undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let mainSheet: InstanceType<typeof Sheet.Root>;

	const schema: z.ZodType<Omit<AclData['acls'][0], 'id'>> = z.object({
		action: z.literal('accept'),
		src: z.array(z.string()).min(1),
		dst: z.array(z.object({ host: z.string(), port: z.string() })).min(1),
		comments: z.array(z.string()).default([])
	});

	const formDefaults = defaults(zod(schema));
	const form = superForm(
		{ ...formDefaults, data: { ...formDefaults.data, action: 'accept' } },
		{
			SPA: true,
			dataType: 'json',
			invalidateAll: true,
			validators: zod(schema),
			async onUpdate({ form }) {
				if (form.valid) {
					try {
						acl.acls.push({
							...form.data,
							id: '0'
						});

						const { error } = await acl.save();
						if (error) throw error;

						successToast('Created new rule');
						dispatch('submit');
						mainSheet.close();
					} catch (err) {
						console.error(err);
						errorToast(formatError(err));
					}
				}
			}
		}
	);

	const { form: formData } = form;

	const description = writable<string>('');

	description.subscribe((desc) => {
		formData.update((data) => ({ ...data, comments: desc.split(/\n{1,}/gm).map((i) => i.trim()) }));
	});
</script>

<Sheet.Root bind:this={mainSheet}>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Create rule</Sheet.Title>
		</Sheet.Header>

		<Form.Root {form} submitText="Create">
			<Form.Field {form} name="action" let:constraints>
				<Form.Control let:attrs>
					<Form.Label>Action</Form.Label>
					<Select.Root {...attrs} {...constraints} selected={{ label: 'accept', value: 'accept' }}>
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

			<Form.Field {form} name="src" let:constraints>
				<Form.Control let:attrs>
					<Form.Label class="required" for={attrs.id}>Source</Form.Label>
					<SelectRuleSource
						{...attrs}
						{...constraints}
						{acl}
						{users}
						bind:selected={$formData.src}
					/>
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="dst" let:constraints>
				<Form.Control let:attrs>
					<Form.Label class="required" for={attrs.id}>Destination</Form.Label>
					<SelectRuleTarget
						{...attrs}
						{...constraints}
						{acl}
						{users}
						bind:selected={$formData.dst}
					/>
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="comments" let:constraints>
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Description</Form.Label>
					<Textarea {...attrs} {...constraints} bind:value={$description} />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Sheet.Content>
</Sheet.Root>
