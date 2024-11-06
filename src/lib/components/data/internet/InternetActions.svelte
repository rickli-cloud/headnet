<script>
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import X from 'lucide-svelte/icons/x';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
</script>

<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
	<span>Internet</span>
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
