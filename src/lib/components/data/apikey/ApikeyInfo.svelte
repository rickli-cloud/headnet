<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import TimerOff from 'lucide-svelte/icons/timer-off';

	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	import * as Tooltip from '$lib/components/ui/tooltip';

	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import { formatDuration, isExpired } from '$lib/utils/time';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { formatError } from '$lib/utils/error';
	import { cn } from '$lib/utils/shadcn';
	import { ApiKey } from '$lib/api';
	import Plus from 'lucide-svelte/icons/plus';
	import { HeadscaleClient } from '$lib/store/session';

	export let apikeys: ApiKey[] | undefined = undefined;

	const dispatch = createEventDispatcher<{ close: undefined }>();

	if (!apikeys) {
		ApiKey.list($HeadscaleClient).then(({ data }) => {
			apikeys = data;
		});
	}

	async function expireApikey(key: ApiKey) {
		try {
			if (!key.expiration || isExpired(key.expiration)) return;

			const { error } = await key.expire($HeadscaleClient);
			if (error) throw error;

			successToast(`Expired API key "${key.prefix}..."`);
			dispatch('close');
		} catch (err) {
			console.error(err);
			errorToast(formatError(err));
		}
	}
</script>

<Sheet.Root let:close>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} {close} />
	</Sheet.Trigger>

	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>API keys</Sheet.Title>
			<Sheet.Description>
				API keys provide administrator level access to Headscale and should never be shared with
				untrusted parties
			</Sheet.Description>
		</Sheet.Header>

		<ul class="menu">
			<li>
				<button disabled on:click={() => void 0}>
					<Plus />
					<span> Create </span>
				</button>
			</li>
		</ul>

		{#if apikeys?.length}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head></Table.Head>
						<Table.Head>Key</Table.Head>
						<Table.Head>Created</Table.Head>
						<Table.Head>Expires</Table.Head>
						<Table.Head>Last seen</Table.Head>
						<Table.Head>ID</Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each apikeys as apiKey}
						<Table.Row>
							<Table.Cell class="pr-0">
								<ConfirmAction
									title="Expire API key"
									on:submit={() => expireApikey(apiKey).then(close)}
									asChild={false}
									disabled={!apiKey.expiration || isExpired(apiKey.expiration)}
								>
									<Tooltip.Root slot="trigger">
										<Tooltip.Trigger tabindex={-1}>
											<TimerOff
												class={cn(
													!apiKey.expiration ||
														(isExpired(apiKey.expiration) && '!text-muted-foreground'),
													'h-4 w-4 hover:text-red-600'
												)}
											/>
										</Tooltip.Trigger>

										<Tooltip.Content side="left">
											<p>Expire</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</ConfirmAction>
							</Table.Cell>

							<Table.Cell>
								{apiKey.prefix ? apiKey.prefix + '...' : undefined}
							</Table.Cell>

							<Table.Cell>
								{apiKey.createdAt ? new Date(apiKey.createdAt).toLocaleString() : undefined}
							</Table.Cell>

							<Table.Cell>
								{apiKey.expiration
									? isExpired(apiKey.expiration)
										? new Date(apiKey.expiration).toLocaleDateString()
										: formatDuration(new Date(apiKey.expiration).getTime() - Date.now())
									: undefined}
							</Table.Cell>

							<Table.Cell>
								{apiKey.lastSeen
									? formatDuration(Date.now() - new Date(apiKey.lastSeen).getTime())
									: undefined}
							</Table.Cell>

							<Table.Cell>
								{apiKey.id}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head></Table.Head>
						<Table.Head>Key</Table.Head>
						<Table.Head>Created</Table.Head>
						<Table.Head>Expires</Table.Head>
						<Table.Head>Last seen</Table.Head>
						<Table.Head>ID</Table.Head>
					</Table.Row>
				</Table.Header>
			</Table.Root>

			<p class="w-full p-4 text-center text-sm text-muted-foreground">no API keys found</p>
		{/if}

		<slot />
	</Sheet.Content>
</Sheet.Root>
