<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';

	import Spinner from '$lib/components/utils/Spinner.svelte';
</script>

<slot>
	<Spinner />
</slot>

<ModeWatcher />
<Toaster />
