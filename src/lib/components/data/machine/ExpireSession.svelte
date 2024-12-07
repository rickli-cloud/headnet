<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import type { Machine } from '$lib/api';

	export let machine: Machine;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	async function handleSubmit() {
		try {
			const { error } = await machine.expire();
			if (error) throw error;

			successToast(`Expired session of machine "${machine.givenName || machine.name}"`);
			dispatch('submit');
		} catch (err) {
			console.error(err);
			errorToast(formatError(err));
		}
	}
</script>

<ConfirmAction title="Expire machine session?" on:submit={handleSubmit}>
	<svelte:fragment slot="trigger" let:builder>
		<slot name="trigger" {builder} />
	</svelte:fragment>
</ConfirmAction>
