<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { z } from 'zod';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';

	import SelectUser from '$lib/components/data/user/SelectUser.svelte';
	import SelectTags from '$lib/components/data/tag/SelectTags.svelte';

	import * as Form from '$lib/components/form';

	import { PreAuthKey, type Policy, type components, type User } from '$lib/api';
	import { formatDuration } from '$lib/utils/time';
	import { formatError } from '$lib/utils/error';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { HeadscaleClient } from '$lib/store/session';
	import type { Full } from '$lib/utils/misc';

	type v1CreatePreAuthKeyRequest = components['schemas']['v1CreatePreAuthKeyRequest'];

	export let policy: Policy;
	export let users: User[] | undefined;
	export let initData: Partial<v1CreatePreAuthKeyRequest> | undefined = undefined;

	const dispatch = createEventDispatcher<{ submit: undefined }>();

	const result = writable<PreAuthKey | undefined>(undefined);
	const resultDialogOpen = writable<boolean>(false);
	let mainSheet: InstanceType<typeof Sheet.Root>;

	const schema: z.ZodType<Full<v1CreatePreAuthKeyRequest>> = z.object({
		user: z.string(),
		expiration: z
			.string()
			.datetime()
			.refine((arg) => new Date(arg).getTime() > Date.now(), {
				message: 'Date must be in the future'
			}),
		reusable: z.boolean(),
		ephemeral: z.boolean(),
		aclTags: z.array(z.string())
	});

	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(schema),
		async onUpdate({ form: { valid, data } }) {
			if (valid) {
				try {
					const res = await PreAuthKey.create($HeadscaleClient, { data });
					if (res.error) throw res.error;

					result.set(res.data);
					mainSheet.close();
					resultDialogOpen.set(true);

					successToast('Created new auth key');
				} catch (err) {
					console.error(err);
					errorToast(formatError(err));
				}
			}
		}
	});

	const { form: formData } = form;

	const exp = writable<string | undefined>();

	exp.subscribe((expiration) => {
		if (typeof expiration === 'string') {
			formData.update((data) => ({ ...data, expiration: new Date(expiration).toISOString() }));
		}
	});

	function reset() {
		formData.set({
			user: '',
			expiration: '',
			reusable: false,
			ephemeral: false,
			aclTags: [],
			...(initData || {})
		});
	}

	reset();
</script>

<Sheet.Root bind:this={mainSheet}>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Create Auth Key</Sheet.Title>
		</Sheet.Header>

		<Form.Root {form} hasRequired submitText="Create">
			<Form.Field {form} name="user" class="required">
				<Form.Control let:attrs>
					<Form.Label>User</Form.Label>
					<SelectUser {...attrs} {users} bind:selected={$formData.user} />
				</Form.Control>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="expiration">
				<Form.Control let:attrs>
					<Form.Label for="expiration">Expiration</Form.Label>
					<Input {...attrs} name="expiration" type="datetime-local" bind:value={$exp} />
				</Form.Control>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="aclTags">
				<Form.Control let:attrs>
					<Form.Label>Tags</Form.Label>
					<SelectTags tags={policy?.tagOwners} bind:selected={$formData.aclTags} />
				</Form.Control>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="reusable" class="!mt-8">
				<div class="flex items-center justify-between gap-x-2.5 [&>*]:!mt-0">
					<Form.Control let:attrs>
						<Form.Label for="is-reusable">Reusable</Form.Label>
						<Switch
							{...attrs}
							aria-required={false}
							id="is-reusable"
							bind:checked={$formData.reusable}
						/>
					</Form.Control>
				</div>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="ephemeral">
				<div class="flex items-center justify-between gap-x-2.5 [&>*]:!mt-0">
					<Form.Control let:attrs>
						<Form.Label for="is-ephemeral">Ephemeral</Form.Label>
						<Switch
							{...attrs}
							aria-required={false}
							id="is-ephemeral"
							bind:checked={$formData.ephemeral}
						/>
					</Form.Control>
				</div>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>
		</Form.Root>

		<slot />
	</Sheet.Content>
</Sheet.Root>

<Dialog.Root
	bind:open={$resultDialogOpen}
	onOpenChange={(open) => (!open && $result ? dispatch('submit') : void 0)}
>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Auth key</Dialog.Title>
			{#if $result?.expiration}
				<Dialog.Description>
					Expires in {formatDuration(new Date($result.expiration).getTime() - Date.now())}
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<pre class="rounded bg-muted px-4 py-2.5 text-muted-foreground"><code>{$result?.key}</code
			></pre>
	</Dialog.Content>
</Dialog.Root>
