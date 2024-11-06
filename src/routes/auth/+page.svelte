<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { get } from 'svelte/store';
	import { z } from 'zod';

	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	// import { Button } from '$lib/components/ui/button';

	import * as Form from '$lib/components/form';

	import { base } from '$app/paths';
	import { initSession, Session } from '$lib/store/session';

	const loginSchema = z.object({
		token: z.string(),
		baseUrl: z.string().url().optional()
	});

	const form = superForm(defaults(zod(loginSchema)), {
		SPA: true,
		dataType: 'json',
		invalidateAll: true,
		validators: zod(loginSchema),
		async onUpdate(ev) {
			if (ev.form.valid) {
				console.debug('initSession', ev.form.data);
				initSession(ev.form.data);

				window.location.href = base + '/';
			}
		}
	});

	const { constraints, form: formData } = form;

	const session = get(Session);
	if (session) {
		formData.set({
			baseUrl: session.baseUrl,
			token: session.token || ''
		});
	}

	formData.subscribe((state) => {
		if (state.baseUrl === '') {
			formData.update((state) => ({
				...state,
				baseUrl: undefined
			}));
		}
	});
</script>

<main class="grid h-full place-items-center">
	<Card.Root class="mx-auto max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Authenticate</Card.Title>
		</Card.Header>

		<Card.Content class="min-w-96">
			<Form.Root {form} reset={() => form.reset({ data: { token: '', baseUrl: '' } })}>
				<Form.Field {form} name="token">
					<Form.Control let:attrs>
						<Form.Label for={attrs.id}>API key</Form.Label>
						<Input
							{...attrs}
							required={$constraints.token?.required}
							bind:value={$formData.token}
						/>
						<Form.FieldErrors />
					</Form.Control>
				</Form.Field>

				<Form.Field {form} name="baseUrl">
					<Form.Control let:attrs>
						<Form.Label for={attrs.id}>API host</Form.Label>
						<Input
							{...attrs}
							{...$constraints.baseUrl || {}}
							bind:value={$formData.baseUrl}
							placeholder="{location.protocol}//{location.host}"
						/>
						<Form.FieldErrors />
					</Form.Control>
				</Form.Field>
			</Form.Root>

			<!-- <div class="my-4 grid items-center gap-2.5" style="grid-template-columns: 1fr auto 1fr; ">
				<div class="border-b"></div>
				<p class="text-border">OR</p>
				<div class="border-b"></div>
			</div>
			<Button class="w-full">Continue with OIDC</Button> -->
		</Card.Content>
	</Card.Root>
</main>
