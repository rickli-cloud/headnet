<script lang="ts">
	import MonacoEditor from '$lib/components/utils/MonacoEditor.svelte';
	import { writable } from 'svelte/store';

	export let data;

	const content = writable<string>(data.acl.stringify());
</script>

<MonacoEditor {content} readonly />
