<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';
</script>

<slot />

<ModeWatcher />
<Toaster />
