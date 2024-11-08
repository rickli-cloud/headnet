<script lang="ts">
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
