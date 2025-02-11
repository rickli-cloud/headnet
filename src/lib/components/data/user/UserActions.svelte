<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import UserRoundPen from 'lucide-svelte/icons/user-round-pen';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import Telescope from 'lucide-svelte/icons/telescope';
	import Trash from 'lucide-svelte/icons/trash-2';

	import type { Policy, User } from '$lib/api';
	import EditUser from './EditUser.svelte';
	import DeleteUser from './DeleteUser.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import CreatePreAuthKey from '../preAuthKey/CreatePreAuthKey.svelte';

	export let user: User;
	export let policy: Policy;
	export let users: User[] | undefined;

	const dispatch = createEventDispatcher<{ close: undefined; focus: undefined }>();
</script>

<li>
	<button on:click={() => dispatch('focus')}>
		<span>
			<Telescope />
		</span>
		<span> Focus </span>
	</button>
</li>

<li>
	<button disabled>
		<span>
			<EyeClosed />
		</span>
		<span> Hide </span>
	</button>
</li>

<li>
	<CreatePreAuthKey
		{users}
		{policy}
		initData={{ user: user.name }}
		on:submit={() => dispatch('close')}
	>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<span>
					<Plus />
				</span>
				<span> Auth key </span>
			</button>
		</svelte:fragment>
	</CreatePreAuthKey>
</li>

<li>
	<EditUser {user} {policy} on:submit={() => dispatch('close')}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<UserRoundPen />
				<span>Edit</span>
			</button>
		</svelte:fragment>
	</EditUser>
</li>

<li class="destructive">
	<DeleteUser {user} {policy} on:submit={() => dispatch('close')}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Trash />
				<span>Delete</span>
			</button>
		</svelte:fragment>
	</DeleteUser>
</li>
