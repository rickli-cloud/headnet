<script lang="ts">
	import { get, writable } from 'svelte/store';

	import Plus from 'lucide-svelte/icons/plus';
	import Trash_2 from 'lucide-svelte/icons/trash-2';

	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	import { Policy, User } from '$lib/api';

	import SelectItem from './SelectItem.svelte';
	import { splitAclDestination } from '$lib/utils/misc';

	export let policy: Policy;
	export let selected: string[];
	export let users: User[] | undefined;

	const items: { [group: string]: string[] } = {
		Users: getNames(users),
		Groups: getNames(policy.groups),
		Hosts: getNames(policy.hosts),
		Tags: getNames(policy.tagOwners),
		Autogroup: ['autogroup:internet'],
		General: ['*']
	};

	const sel = writable<RuleTarget[]>(selected.map((sel) => splitAclDestination(sel)));
	const newItemTarget = writable<string>('');
	const newItemPorts = writable<string>('');

	sel.subscribe((sel) => {
		selected = sel.map(({ host, port }) => `${host}:${port}`);
	});

	function handleAdd() {
		const host = get(newItemTarget);
		const port = get(newItemPorts);

		if (!host.length || !port.length) return;

		sel.update((s) => [...s, { host, port }]);
		selected = [...selected, `${host}:${port}`];

		newItemTarget.set('');
		newItemPorts.set('');
	}

	function handleDelete(item: RuleTarget) {
		if (!item.host.length || !item.port.length) return;

		sel.update((sel) => sel.filter((i) => i.host !== item.host && item.port !== item.port));
		selected = selected.filter((i) => i !== `${item.host}:${item.port}`);
	}

	function getNames(items: Partial<{ name: string }>[] | object | undefined): string[] {
		return Array.isArray(items)
			? items?.map((i) => i.name).filter((i) => typeof i !== 'undefined') || []
			: typeof items === 'object'
				? Object.keys(items)
				: [];
	}

	interface RuleTarget {
		host: string;
		port: string;
	}
</script>

<div class="space-y-2">
	{#each $sel || [] as item, i}
		<div class="grid gap-1.5" style="grid-template-columns: 3fr 1fr auto;">
			<SelectItem {items} bind:selected={$sel[i].host}></SelectItem>

			<Input placeholder="Ports" required bind:value={$sel[i].port} />

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
