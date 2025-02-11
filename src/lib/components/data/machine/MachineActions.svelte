<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import MonitorCog from 'lucide-svelte/icons/monitor-cog';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import ShieldOff from 'lucide-svelte/icons/shield-off';
	import Telescope from 'lucide-svelte/icons/telescope';
	import Trash from 'lucide-svelte/icons/trash-2';

	import type { Node, User } from '$lib/api';

	import DeleteMachine from './DeleteMachine.svelte';
	import EditMachine from './EditMachine.svelte';
	import ExpireSession from './ExpireSession.svelte';
	import { isExpired } from '$lib/utils/time';

	export let machine: Node;
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
	<EditMachine {machine} {users}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<MonitorCog />
				<span>Edit</span>
			</button>
		</svelte:fragment>
	</EditMachine>
</li>

<li class="destructive">
	<ExpireSession {machine} on:submit={() => dispatch('close')}>
		<svelte:fragment slot="trigger" let:builder>
			<button
				{...builder}
				use:builder.action
				disabled={!machine.expiry || isExpired(machine.expiry)}
			>
				<ShieldOff />
				<span>Expire session</span>
			</button>
		</svelte:fragment>
	</ExpireSession>
</li>

<li class="destructive">
	<DeleteMachine {machine} on:submit={() => dispatch('close')}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Trash />
				<span>Delete</span>
			</button>
		</svelte:fragment>
	</DeleteMachine>
</li>
