<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

{@render children()}

<ModeWatcher />
