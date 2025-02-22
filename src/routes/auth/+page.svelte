<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { get } from 'svelte/store';
	import { z } from 'zod';

	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import Info from 'lucide-svelte/icons/info';
	import Eye from 'lucide-svelte/icons/eye';

	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	import * as Form from '$lib/components/form';
	import * as Alert from '$lib/components/ui/alert';

	import { initSession, Session } from '$lib/store/session';
	import { isTouchDevice } from '$lib/utils/client';
	import { isTauri } from '$lib/utils/tauri';
	import { env } from '$env/dynamic/public';
	import { base } from '$app/paths';
	// import { version } from '$app/environment';

	let tokenVisible: boolean = false;

	const loginSchema = z.object({
		token: z.string(),
		baseUrl: isTauri() ? z.string().url() : z.string().url().optional()
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

	if (env.HEADNET_MOCK_ENABLED === 'true') {
		tokenVisible = true;
		formData.set({ token: 'demo-key' });
	}
</script>

<main class="h-full place-items-center overflow-y-scroll sm:grid">
	<Card.Root class="mx-auto my-4 w-full max-w-lg border-0">
		<!-- <Card.Header>
			<div class="flex justify-between gap-3">
				<Card.Title class="text-2xl">Headnet</Card.Title>
				<span class="text-xs text-muted-foreground">{formatVersion(version)}</span>
			</div>
		</Card.Header> -->

		<Card.Content class="min-w-96">
			<div class="mb-8 space-y-2.5 [&>div]:!mb-0">
				{#if isTouchDevice()}
					<Alert.Root class="mb-6">
						<TriangleAlert class="h-4 w-4" />
						<Alert.Title>Touch device</Alert.Title>
						<Alert.Description class="text-muted-foreground">
							Please note that using a touch device may limit functionality, as some features are
							optimized for mouse input, potentially impacting your experience.
						</Alert.Description>
					</Alert.Root>
				{/if}

				{#if env.HEADNET_MOCK_ENABLED === 'true'}
					<Alert.Root class="mb-6">
						<Info class="h-4 w-4" />
						<Alert.Title>Demo mode</Alert.Title>
						<Alert.Description class="text-muted-foreground">
							Headnet is running against an in-browser mock API powered by
							<a class="link" href="https://mswjs.io/"> Mock Service Worker </a>. Feel free to play
							around and break stuff.
						</Alert.Description>
					</Alert.Root>
				{/if}
			</div>

			<Form.Root
				{form}
				hasRequired
				reset={() => form.reset({ data: { token: '', baseUrl: '' } })}
				submitText="Continue"
			>
				<Form.Field {form} name="token" class="required">
					<Form.Control let:attrs>
						<Form.Label for={attrs.id}>API key</Form.Label>
						<div class="flex gap-1.5">
							<Input
								{...attrs}
								required={$constraints.token?.required}
								bind:value={$formData.token}
								type={tokenVisible ? 'text' : 'password'}
							/>
							<Button variant="outline" on:click={() => (tokenVisible = !tokenVisible)}>
								{#if tokenVisible}
									<EyeOff class="h-5 w-5" />
								{:else}
									<Eye class="h-5 w-5" />
								{/if}
							</Button>
						</div>
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
							placeholder={isTauri() ? '' : `${location.protocol}//${location.host}`}
							disabled={env.HEADNET_MOCK_ENABLED === 'true'}
						/>
						<Form.FieldErrors />
					</Form.Control>
				</Form.Field>
			</Form.Root>

			<!-- <div
				class="my-4 grid select-none items-center gap-2.5"
				style="grid-template-columns: 1fr auto 1fr; "
			>
				<div class="border-b"></div>
				<p class="text-border">or</p>
				<div class="border-b"></div>
			</div>
			<Button class="w-full">Continue with OIDC</Button> -->
		</Card.Content>
	</Card.Root>
</main>
