<script lang="ts">
	import { get, writable } from 'svelte/store';

	import Plus from 'lucide-svelte/icons/plus';
	import Trash_2 from 'lucide-svelte/icons/trash-2';

	import { Button } from '$lib/components/ui/button';

	import { Acl, User } from '$lib/api';

	import SelectItem from './SelectItem.svelte';

	export let acl: Acl;
	export let selected: string[];
	export let users: User[] | undefined;

	const items: { [group: string]: string[] } = {
		Users: getNames(users),
		Groups: getNames(acl.groups),
		Hosts: getNames(acl.hosts),
		Tags: getNames(acl.tagOwners),
		General: ['*']
	};

	const sel = writable<string[]>(selected);
	const newItem = writable<string>('');

	function handleAdd() {
		if (!get(newItem).length) return;

		sel.update((s) => [...s, get(newItem)]);
		selected = [...selected, get(newItem)];

		newItem.set('');
	}

	function handleDelete(item: string) {
		if (!item.length) return;

		sel.update((sel) => sel.filter((i) => i !== item));
		selected = selected.filter((i) => i !== item);
	}

	function getNames(items: Partial<{ name: string }>[] | undefined): string[] {
		return items?.map((i) => i.name).filter((i) => typeof i !== 'undefined') || [];
	}
</script>

<div class="space-y-2">
	{#each $sel || [] as item}
		<div class="grid gap-1.5" style="grid-template-columns: 1fr auto;">
			<SelectItem {items} bind:selected={item}></SelectItem>

			<Button
				class="hover:bg-destructive hover:text-destructive-foreground"
				variant="outline"
				on:click={() => handleDelete(item)}
			>
				<Trash_2 class="h-4 w-4" />
			</Button>
		</div>
	{/each}

	<form
		class="!mt-5 grid gap-1.5"
		style="grid-template-columns: 1fr auto;"
		on:submit|preventDefault|stopPropagation={handleAdd}
	>
		{#key $newItem}
			<SelectItem {items} bind:selected={$newItem} />
		{/key}

		<Button type="submit" variant="outline" disabled={!$newItem.length}>
			<Plus class="h-4 w-4" />
		</Button>
	</form>
</div>
