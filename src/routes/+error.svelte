<script lang="ts">
	import ErrorComponent from '$lib/components/utils/ErrorComponent.svelte';

	import { page } from '$app/stores';
	import { get, writable } from 'svelte/store';

	function getErr(error = get(page).error) {
		const err = new Error(error?.message || 'Internal error');
		err.name = 'SvelteKitError';
		return err;
	}

	const err = writable(getErr());
	page.subscribe((state) => err.set(getErr(state.error)));
</script>

<main class="p-4">
	<ErrorComponent err={$err} />
</main>
