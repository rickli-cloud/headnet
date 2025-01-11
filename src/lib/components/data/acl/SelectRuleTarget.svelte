<script lang="ts">
	import { get, writable } from 'svelte/store';

	import Plus from 'lucide-svelte/icons/plus';
	import Trash_2 from 'lucide-svelte/icons/trash-2';

	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	import { Acl, User } from '$lib/api';

	import SelectItem from './SelectItem.svelte';

	export let acl: Acl;
	export let selected: RuleTarget[];
	export let users: User[] | undefined;

	const items: { [group: string]: string[] } = {
		Users: getNames(users),
		Groups: getNames(acl.groups),
		Hosts: getNames(acl.hosts),
		Tags: getNames(acl.tagOwners),
		General: ['*'],
		Autogroup: ['autogroup:internet']
	};

	const sel = writable<RuleTarget[]>(selected);
	const newItemTarget = writable<string>('');
	const newItemPorts = writable<string>('');

	function handleAdd() {
		const host = get(newItemTarget);
		const port = get(newItemPorts);

		if (!host.length || !port.length) return;

		sel.update((s) => [...s, { host, port }]);
		selected = [...selected, { host, port }];

		newItemTarget.set('');
		newItemPorts.set('');
	}

	function handleDelete(item: RuleTarget) {
		if (!item.host.length || !item.port.length) return;

		sel.update((sel) => sel.filter((i) => i.host !== item.host && item.port !== item.port));
		selected = selected.filter((i) => i.host !== item.host && item.port !== item.port);
	}

	function getNames(items: Partial<{ name: string }>[] | undefined): string[] {
		return items?.map((i) => i.name).filter((i) => typeof i !== 'undefined') || [];
	}

	interface RuleTarget {
		host: string;
		port: string;
	}
</script>

<div class="space-y-2">
	{#each $sel || [] as item}
		<div class="grid gap-1.5" style="grid-template-columns: 3fr 1fr auto;">
			<SelectItem {items} bind:selected={item.host}></SelectItem>

			<Input placeholder="Ports" required bind:value={item.port} />

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
		style="grid-template-columns: 3fr 1fr auto;"
		on:submit|stopPropagation|preventDefault={handleAdd}
	>
		{#key $newItemTarget}
			<SelectItem {items} bind:selected={$newItemTarget} />
		{/key}

		<Input placeholder="Ports" required bind:value={$newItemPorts} />

		<Button type="submit" variant="outline" disabled={!$newItemTarget.length}>
			<Plus class="h-4 w-4" />
		</Button>
	</form>
</div>
