<script lang="ts">
	import type { Selected } from 'bits-ui';
	import { get, writable } from 'svelte/store';

	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	import { Acl, groupRegex, tagRegex, User } from '$lib/api';

	export let acl: Acl;
	export let selected: string[];
	export let users: User[] | undefined;
	export let required = true;
	export let id: string = window.crypto.randomUUID();

	const sel = writable<Selected<string>[]>([]);
	sel.subscribe((state) => (selected = state?.map((i) => i.value)));

	const customItemInput = writable<string>();
	const customItems = writable<string[]>(filterCustomItems());

	function commentFilter(data: Array<string>, replaceRegex?: RegExp): Array<string> {
		return data
			.filter((i) => i !== '$$comments')
			.map((i) => (replaceRegex ? i.replace(replaceRegex, '') : i));
	}

	function filterCustomItems(): string[] {
		const tags = getNames(acl.tagOwners);
		const groups = getNames(acl.groups);
		const hosts = getNames(acl.hosts);

		return selected.filter(
			(item) =>
				item !== '*' &&
				!groups.find((group) => group === item) &&
				!tags.find((tag) => tag === item) &&
				!hosts.find((host) => host === item) &&
				!users?.find((usr) => usr.name === item)
		);
	}

	function handleAdd() {
		const input = get(customItemInput);
		customItems.update((items) => [...items, input]);
		customItemInput.set('');
	}

	function getNames(items: { name: string }[]): string[] {
		return items.map((i) => i.name);
	}
</script>

<Select.Root portal={null} multiple bind:selected={$sel} {required}>
	<Select.Trigger>
		<Select.Value asChild>
			<span>
				{($sel.length || 0) + ' selected'}
			</span>
		</Select.Value>
	</Select.Trigger>

	<Select.Content class="h-96 overflow-y-scroll">
		<Select.Group>
			<Select.Label>Users</Select.Label>
			{#each users || [] as user}
				<Select.Item value={user.name}>
					{user.name}
				</Select.Item>
			{/each}
		</Select.Group>

		<Select.Group>
			<Select.Label>Groups</Select.Label>
			{#each commentFilter(getNames(acl.groups)) as group}
				<Select.Item value={group}>
					{group.replace(groupRegex, '')}
				</Select.Item>
			{/each}
		</Select.Group>

		<Select.Group>
			<Select.Label>Hosts</Select.Label>
			{#each commentFilter(getNames(acl.hosts)) as host}
				<Select.Item value={host}>
					{host.replace(tagRegex, '')}
				</Select.Item>
			{/each}
		</Select.Group>

		<Select.Group>
			<Select.Label>Known tags</Select.Label>
			{#each commentFilter(getNames(acl.tagOwners)) as tag}
				<Select.Item value={tag}>
					{tag.replace(tagRegex, '')}
				</Select.Item>
			{/each}
		</Select.Group>

		<Select.Group>
			<Select.Label>General</Select.Label>
			<Select.Item value="*">Any</Select.Item>
		</Select.Group>

		<Select.Group>
			<Select.Label>Custom</Select.Label>
			{#each $customItems as tag}
				<Select.Item value={tag}>
					{tag}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>

	<Select.Input name={id} {id} />
</Select.Root>

<form
	class="mb-3 mt-2 grid gap-2.5"
	style="grid-template-columns: 1fr 50px;"
	on:submit|preventDefault={handleAdd}
>
	<Input placeholder="Custom" bind:value={$customItemInput} />
	<Button type="submit">Add</Button>
</form>
