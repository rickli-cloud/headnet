<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import type { Node } from '$lib/api';
	import { HeadscaleClient } from '$lib/store/session';

	export let machine: Node;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	async function handleSubmit() {
		try {
			const { error } = await machine.delete($HeadscaleClient);
			if (error) throw error;

			successToast(`Deleted machine "${machine.givenName || machine.name}"`);
			dispatch('submit');
		} catch (err) {
			console.error(err);
			errorToast(formatError(err));
		}
	}
</script>

<ConfirmAction title="Delete machine?" on:submit={handleSubmit}>
	<svelte:fragment slot="trigger" let:builder>
		<slot name="trigger" {builder} />
	</svelte:fragment>
</ConfirmAction>
