<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { HeadscaleClient } from '$lib/store/session';
	import { formatError } from '$lib/utils/error';
	import type { Policy, User } from '$lib/api';

	export let user: User;
	export let policy: Policy;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	async function deleteUser() {
		try {
			const res = await user.delete($HeadscaleClient);
			if (res.error) throw res.error;

			if (policy.groups) {
				let changesMade = false;

				for (const [name, members] of Object.entries(policy.groups || {})) {
					if (members.includes(user.name as string)) {
						changesMade = true;
						policy.groups[name] = members.filter((i) => i !== user.name);
					}
				}

				if (changesMade) {
					const res = await policy.save($HeadscaleClient);
					if (res.error) throw res.error;
				}
			}

			successToast(`Deleted user "${user.name}"`);
			dispatch('submit');
		} catch (err) {
			console.error(err);
			errorToast(formatError(err));
		}
	}
</script>

<ConfirmAction title="Delete user?" on:submit={deleteUser}>
	<svelte:fragment slot="trigger" let:builder>
		<slot name="trigger" {builder} />
	</svelte:fragment>
</ConfirmAction>
