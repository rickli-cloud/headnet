<script lang="ts">
	import { type ComponentProps } from 'svelte';
	import { get, writable } from 'svelte/store';
	import * as monaco from 'monaco-editor';

	import FileDown from 'lucide-svelte/icons/file-down';
	import FileUp from 'lucide-svelte/icons/file-up';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Save from 'lucide-svelte/icons/save';

	import { Button } from '$lib/components/ui/button';

	import MonacoEditor from '$lib/components/utils/MonacoEditor.svelte';
	import { errorToast, successToast } from '$lib/utils/toast.js';
	import { formatError } from '$lib/utils/error.js';

	export let data;

	let editor: ComponentProps<MonacoEditor>['editor'];

	const model = monaco.editor.createModel(data.acl.stringify(), 'json');
	const policy = writable<string>(data.acl.stringify());

	model.onDidChangeContent(() => policy.set(model.getValue()));

	async function save() {
		try {
			const { error } = await data.acl.save(get(policy));
			if (error) throw error;

			successToast('Policy saved');
		} catch (err) {
			console.error(err);
			errorToast(formatError(err));
		}
	}
</script>

<aside class="lg:col-[1] lg:row-[2]">
	<nav class="grid gap-y-1.5">
		<Button variant="ghost" class="relative justify-start" on:click={save}>
			<div class="relative flex items-center gap-1.5">
				<Save class="h-4 w-4" />
				<span> Save </span>
			</div>
		</Button>

		<Button
			variant="ghost"
			class="relative justify-start"
			href="data:text/plain;charset=urf-8,{$policy}"
			download="policy.hujson"
		>
			<div class="relative flex items-center gap-1.5">
				<FileDown class="h-4 w-4" />
				<span> Download </span>
			</div>
		</Button>

		<Button variant="ghost" disabled class="relative justify-start">
			<div class="relative flex items-center gap-1.5">
				<FileUp class="h-4 w-4" />
				<span> Upload </span>
			</div>
		</Button>

		<Button variant="ghost" disabled class="relative justify-start border-red-600 text-red-600">
			<div class="relative flex items-center gap-1.5">
				<Trash class="h-4 w-4" />
				<span> Reset </span>
			</div>
		</Button>
	</nav>
</aside>

<MonacoEditor
	class="row-span-12 h-full w-full"
	bind:editor
	on:ready={(ev) => {
		ev.detail.setModel(model);
	}}
/>
