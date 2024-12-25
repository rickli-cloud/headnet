<script lang="ts">
	import EyeClosed from 'lucide-svelte/icons/eye-closed';
	import X from 'lucide-svelte/icons/x';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ close: undefined }>();
</script>

<li>
	<button disabled>
		<span>
			<EyeClosed />
		</span>
		<span> Hide </span>
	</button>
</li>
