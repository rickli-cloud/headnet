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

	import type { Policy } from '$lib/api';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import Input from '$lib/components/ui/input/input.svelte';
	import { HeadscaleClient } from '$lib/store/session';

	export let policy: Policy;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	let mainSheet: InstanceType<typeof Sheet.Root>;

	const schema = z.object({
		name: z.string(),
		cidr: z.string(),
		comments: z.array(z.string()).default([])
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate({ form: { valid, data } }) {
			if (valid) {
				try {
					if (!policy.hosts) policy.hosts = {};

					policy.hosts[data.name] = data.cidr;

					const { error } = await policy.save($HeadscaleClient);
					if (error) throw error;

					successToast(`Created new host ${data.name}`);
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
			<Sheet.Title>Create host</Sheet.Title>
		</Sheet.Header>

		<Form.Root {form} submitText="Create">
			<Form.Field {form} name="name" let:constraints>
				<Form.Control let:attrs>
					<Form.Label class="required" for={attrs.id}>Name</Form.Label>
					<Input {...constraints} {...attrs} bind:value={$formData.name} />
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="cidr" let:constraints>
				<Form.Control let:attrs>
					<Form.Label class="required" for={attrs.id}>CIDR</Form.Label>
					<Input {...constraints} {...attrs} bind:value={$formData.cidr} />
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>

			<Form.Field {form} name="comments" let:constraints>
				<Form.Control let:attrs>
					<Form.Label for={attrs.id}>Description</Form.Label>
					<Textarea {...constraints} {...attrs} bind:value={$description} />
				</Form.Control>
			</Form.Field>
		</Form.Root>
	</Sheet.Content>
</Sheet.Root>
