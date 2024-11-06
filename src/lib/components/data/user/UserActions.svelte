<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import UserRoundPen from 'lucide-svelte/icons/user-round-pen';
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import Trash from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';

	import type { User } from '$lib/api';

	export let user: User;

	const dispatch = createEventDispatcher();
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
	<button disabled>
		<span>
			<EyeClosed />
		</span>
		<span> Hide </span>
	</button>
</li>

<li>
	<button disabled>
		<UserRoundPen />
		<span>Edit</span>
	</button>
</li>

<li class="destructive">
	<button disabled>
		<Trash />
		<span>Delete</span>
	</button>
</li>
