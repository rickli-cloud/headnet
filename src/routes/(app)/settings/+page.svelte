<script lang="ts">
	import { zod } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { mode, setMode } from 'mode-watcher';
	import { get } from 'svelte/store';
	import { z } from 'zod';

	export const schema = z.object({
		theme: z.enum(['dark', 'light'], {
			required_error: 'Please select a theme.'
		})
	});

	import { version as apiVersion } from '$lib/api/gen/headscale';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { dev, version } from '$app/environment';
	import { formatVersion } from '$lib/utils/misc';
	import { Session } from '$lib/store/session';
	import { env } from '$env/dynamic/public';

	const form = superForm(
		{ theme: get(mode) },
		{
			SPA: true,
			dataType: 'json',
			invalidateAll: true,
			validators: zod(schema),
			onChange(ev) {
				const theme = ev.get('theme');
				if (theme) setMode(theme);
			}
		}
	);

	const { form: formData, enhance } = form;
</script>

<div class="row-span-12 space-y-6">
	<div class="w-full border-b pb-4">
		<h3 class="text-lg font-medium">Appearance</h3>
		<!-- <p class="text-sm text-muted-foreground"></p> -->
	</div>

	<form method="POST" use:enhance class="space-y-8">
		<Form.Fieldset {form} name="theme">
			<Form.Legend>Theme</Form.Legend>
			<Form.Description>Select the theme for the dashboard.</Form.Description>
			<Form.FieldErrors />
			<RadioGroup.Root
				class="grid max-w-md grid-cols-2 gap-8 pt-2"
				orientation="horizontal"
				bind:value={$formData.theme}
			>
				<Form.Control let:attrs>
					<Label class="[&:has([data-state=checked])>div]:border-primary">
						<RadioGroup.Item {...attrs} value="light" class="sr-only" />
						<div class="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
							<div class="space-y-2 rounded-sm bg-[#ecedef] p-2">
								<div class="space-y-2 rounded-md bg-white p-2 shadow-sm">
									<div class="h-2 w-[80px] rounded-lg bg-[#ecedef]"></div>
									<div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
								</div>
								<div class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
									<div class="h-4 w-4 rounded-full bg-[#ecedef]"></div>
									<div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
								</div>
								<div class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
									<div class="h-4 w-4 rounded-full bg-[#ecedef]"></div>
									<div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
								</div>
							</div>
						</div>
						<span class="block w-full p-2 text-center font-normal"> Light </span>
					</Label>
				</Form.Control>

				<Form.Control let:attrs>
					<Label class="[&:has([data-state=checked])>div]:border-primary">
						<RadioGroup.Item {...attrs} value="dark" class="sr-only" />
						<div
							class="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground"
						>
							<div class="space-y-2 rounded-sm bg-slate-950 p-2">
								<div class="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
									<div class="h-2 w-[80px] rounded-lg bg-slate-400"></div>
									<div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
								</div>
								<div class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
									<div class="h-4 w-4 rounded-full bg-slate-400"></div>
									<div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
								</div>
								<div class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
									<div class="h-4 w-4 rounded-full bg-slate-400"></div>
									<div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
								</div>
							</div>
						</div>
						<span class="block w-full p-2 text-center font-normal"> Dark </span>
					</Label>
				</Form.Control>

				<RadioGroup.Input name="theme" />
			</RadioGroup.Root>
		</Form.Fieldset>
	</form>

	<br />

	<div class="w-full border-b pb-4">
		<h3 class="text-lg font-medium">About</h3>
		<!-- <p class="text-sm text-muted-foreground"></p> -->
	</div>

	<div class="grid items-center gap-x-16 gap-y-4" style="grid-template-columns: auto 1fr;">
		<div class="space-y-2">
			<h4 class="text-sm font-medium">Version</h4>
		</div>

		<div class="text-sm">
			{dev ? 'development' : formatVersion(version)}
		</div>

		<div>
			<h4 class="text-sm font-medium">API version</h4>
		</div>

		<div class="text-sm">
			v1-{apiVersion}
		</div>

		<div>
			<h4 class="text-sm font-medium">API host</h4>
		</div>

		<div class="text-sm">
			{#if env.HEADNET_MOCK_ENABLED}
				msw
			{:else}
				{$Session?.baseUrl || `${window.location.protocol}//${window.location.host}`}
			{/if}
		</div>
	</div>
</div>
