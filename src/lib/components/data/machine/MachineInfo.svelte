<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import ClipboardCopy from 'lucide-svelte/icons/clipboard-copy';

	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Form from '$lib/components/form';

	import type { Machine, Route } from '$lib/api';
	import Secret from '$lib/components/utils/Secret.svelte';
	import { isV6Format, isV4Format } from 'ip';

	export let machine: Machine;

	/* const schema = z.object({
		name: z.string()
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		onUpdate(ev) {
			if (ev.form.valid) {
				console.debug('Form is valid', ev);
			}
		}
	});

	const { constraints, form: formData } = form;

	formData.set({ name: machine.givenName || '' });

	function reset() {} */
</script>

<!-- <Form.Root {form} {reset} submitText="Save">
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Form.Label for={attrs.id}>Given name</Form.Label>
			<Input {...attrs} {...$constraints.name || {}} bind:value={$formData.name} />
		</Form.Control>
	</Form.Field>

	<div>
		<Label for="user.id">Name</Label>
		<Input id="user.id" readonly value={machine.name} />
	</div>

	<div>
		<Label for="user.id">ID</Label>
		<Input id="user.id" readonly value={machine.id} />
	</div>

	<div>
		<Label for="user.id">Node key</Label>
		<Input id="user.id" type="password" readonly value={machine.nodeKey} />
	</div>

	<div>
		<Label for="user.id">Machine key</Label>
		<Input id="user.id" type="password" readonly value={machine.machineKey} />
	</div>

	<div>
		<Label for="user.id">Disco key</Label>
		<Input id="user.id" type="password" readonly value={machine.discoKey} />
	</div>
</Form.Root> -->

<!-- <table class="basic-table w-full">
	<tbody>
		<tr>
			<th>Name</th>
			<td>{machine.name}</td>
		</tr>

		<tr>
			<th>Machine key</th>
			<td><Secret secret={machine.machineKey} /></td>
		</tr>
	</tbody>
</table> -->

<div class="space-y-2">
	<div class="text-sm font-medium">Disco Key</div>
	<Secret secret={machine.discoKey} />
</div>

<div class="space-y-2">
	<div class="text-sm font-medium">Node Key</div>
	<Secret secret={machine.nodeKey} />
</div>

<div class="space-y-2">
	<div class="text-sm font-medium">Machine Key</div>
	<Secret secret={machine.machineKey} />
</div>

<div class="space-y-2">
	<div class="text-sm font-medium">Addresses</div>
	<ul class="list-disc pl-6">
		{#each machine.ipAddresses || [] as ip}
			<li>
				<button
					class="hover:underline"
					on:click={() => navigator.clipboard.writeText(ip)}
					on:dblclick={() =>
						open(
							isV4Format(ip) ? 'http://' + ip : isV6Format(ip) ? `http://[${ip}]` : ip,
							'_blank'
						)}
				>
					<span>{ip}</span>
				</button>
			</li>
		{/each}
	</ul>
</div>

<!-- <form class="data-form">
	<div>
		<Label for="user.id">Machine key</Label>
		<Input id="user.id" type="password" readonly value={machine.machineKey} />
	</div>

	<div>
		<Label for="user.id">Node key</Label>
		<Input id="user.id" type="password" readonly value={machine.nodeKey} />
	</div>

	<div>
		<Label for="user.id">Disco key</Label>
		<Input id="user.id" type="password" readonly value={machine.discoKey} />
	</div>
</form> -->

<!-- <table class="basic-table w-full overflow-x-scroll">
	<tbody>
		<tr>
			<th>Name</th>
			<td>{machine.name}</td>
		</tr>

		<tr>
			<th>ID</th>
			<td>{machine.id}</td>
		</tr>

		<tr>
			<th>Created</th>
			<td>{machine.createdAt}</td>
		</tr>
	</tbody>
</table> -->
