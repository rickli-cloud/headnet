<script lang="ts">
	import { type ComponentProps } from 'svelte';
	import * as monaco from 'monaco-editor';

	import MonacoEditor from '$lib/components/utils/MonacoEditor.svelte';

	export let data;

	let editor: ComponentProps<MonacoEditor>['editor'];
</script>

<MonacoEditor
	class="h-full w-full"
	bind:editor
	on:ready={(ev) => {
		ev.detail.setModel(monaco.editor.createModel(data.acl.stringify(), 'json'));
	}}
/>
