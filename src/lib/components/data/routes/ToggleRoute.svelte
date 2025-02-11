<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import type { Route } from '$lib/api';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import { HeadscaleClient } from '$lib/store/session';

	export let route: Route;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	async function handleSubmit() {
		try {
			const action = route.enabled ? route.enable : route.disable;

			const { error } = await action($HeadscaleClient);
			if (error) throw error;

			successToast(`${route.enabled ? 'Disabled' : 'Enabled'} route "${route.prefix}"`);
			dispatch('submit');
		} catch (err) {
			console.error(err);
			errorToast(formatError(err));
		}
	}
</script>

<ConfirmAction
	title="{route.enabled ? 'Disable' : 'Enable'} route"
	description={route.enabled
		? 'Prevent everyone from using this route'
		: 'Allow clients to use this route'}
	on:submit={handleSubmit}
	confirm={false}
	destructive={route.enabled}
>
	<svelte:fragment slot="trigger" let:builder>
		<slot name="trigger" {builder} />
	</svelte:fragment>
</ConfirmAction>

<!-- <script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';

	import * as Form from '$lib/components/form';

	import type { Route } from '$lib/api';

	export let route: Route;

	let open: boolean;

	const schema = z.object({});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate(ev) {
			if (ev.form.valid) {
				open = false;
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{route.enabled ? 'Disable' : 'Enable'} route</Dialog.Title>
		</Dialog.Header>

		<Form.Root {form} destructive={route.enabled} submitText="Confirm" class="mt-4"></Form.Root>
	</Dialog.Content>
</Dialog.Root>
 -->
