<script lang="ts">
	import MonitorCog from 'lucide-svelte/icons/monitor-cog';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import ShieldOff from 'lucide-svelte/icons/shield-off';
	import Telescope from 'lucide-svelte/icons/telescope';
	import Trash from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';

	import type { Machine } from '$lib/api';

	import MachineStatus from './MachineStatus.svelte';
	import { createEventDispatcher } from 'svelte';
	import DeleteMachine from './DeleteMachine.svelte';
	import EditMachine from './EditMachine.svelte';

	export let machine: Machine;

	const dispatch = createEventDispatcher<{ close: undefined; focus: undefined }>();
</script>

<div class="grid items-center gap-2" style="grid-template-columns: auto 1fr auto;">
	<MachineStatus online={machine.online} lastSeen={machine.lastSeen} />

	<div>
		<span>{machine.givenName}</span>
		<span class="text-muted-foreground">#{machine.id}</span>
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
	<EditMachine {machine}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<MonitorCog />
				<span>Edit</span>
			</button>
		</svelte:fragment>
	</EditMachine>
</li>

<li class="destructive">
	<button disabled>
		<ShieldOff />
		<span>Expire session</span>
	</button>
</li>

<li class="destructive">
	<DeleteMachine {machine}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Trash />
				<span>Delete</span>
			</button>
		</svelte:fragment>
	</DeleteMachine>
</li>
