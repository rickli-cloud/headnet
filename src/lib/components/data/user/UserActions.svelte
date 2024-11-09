<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import UserRoundPen from 'lucide-svelte/icons/user-round-pen';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import Telescope from 'lucide-svelte/icons/telescope';
	import Trash from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';

	import type { Acl, User } from '$lib/api';
	import EditUser from './EditUser.svelte';
	import DeleteUser from './DeleteUser.svelte';

	export let user: User;
	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ close: undefined; focus: undefined }>();
</script>

<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
	<div>
		<span>{user.name}</span>
		<span class="text-muted-foreground">#{user.id}</span>
	</div>

	<button
		class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted"
		on:click={() => dispatch('close')}
	>
		<X class="h-4 w-4" />
	</button>
</div>
<hr />

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
	<EditUser {user} {acl}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<UserRoundPen />
				<span>Edit</span>
			</button>
		</svelte:fragment>
	</EditUser>
</li>

<li class="destructive">
	<DeleteUser {user}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Trash />
				<span>Delete</span>
			</button>
		</svelte:fragment>
	</DeleteUser>
</li>
