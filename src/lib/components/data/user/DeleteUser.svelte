<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import type { Acl, User } from '$lib/api';

	export let user: User;
	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	async function deleteUser() {
		try {
			const res = await user.delete();
			if (res.error) throw res.error;

			if (acl?.groups.find((group) => group.members.includes(user.name as string))) {
				acl.groups = acl.groups.map((group) => ({
					...group,
					members: group.members.filter((member) => member !== user.name)
				}));
				const res = await acl.save();
				if (res.error) throw res.error;
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
