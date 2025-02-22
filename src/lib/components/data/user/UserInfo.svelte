<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';
	import TimerOff from 'lucide-svelte/icons/timer-off';
	// import UserRoundPen from 'lucide-svelte/icons/user-round-pen';
	// import Trash from 'lucide-svelte/icons/trash-2';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import Secret from '$lib/components/utils/Secret.svelte';

	import { formatDuration, isExpired } from '$lib/utils/time';
	import type { Policy, PreAuthKey, User } from '$lib/api';

	import ExpirePreAuthKey from '../preAuthKey/ExpirePreAuthKey.svelte';
	import UserActions from './UserActions.svelte';
	// import DeleteUser from './DeleteUser.svelte';
	// import EditUser from './EditUser.svelte';

	export let user: User;
	export let policy: Policy;
	export let users: User[] | undefined;
	export let preAuthKeys: PreAuthKey[] | undefined;

	const dispatch = createEventDispatcher<{ close: undefined; focus: undefined }>();

	$: groups = policy.groups
		? Object.entries(policy.groups)
				.filter(([name, members]) => members.includes(user.name as string))
				.map(([name]) => name)
		: [];

	$: keys = preAuthKeys?.filter((key) => key.user === user.name) || [];

	function close() {
		dispatch('close');
	}
</script>

<Sheet.Header>
	<Sheet.Title class="flex items-center gap-1.5">
		<!-- <DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="ghost" class="h-7 w-7 p-1.5">
					<EllipsisVertical class="h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="start" class="min-w-64 max-w-96">
				<DropdownMenu.Group>
					<DropdownMenu.Item asChild>
						<EditUser {user} {acl} on:submit={close}>
							<svelte:fragment slot="trigger" let:builder>
								<button class="menu-button" {...builder} use:builder.action>
									<UserRoundPen class="mr-2 h-4 w-4" />
									<span>Edit</span>
								</button>
							</svelte:fragment>
						</EditUser>
					</DropdownMenu.Item>

					<DropdownMenu.Item asChild>
						<DeleteUser {user} {acl} on:submit={close}>
							<svelte:fragment slot="trigger" let:builder>
								<button class="menu-button destructive" {...builder} use:builder.action>
									<Trash class="mr-2 h-4 w-4" />
									<span>Delete</span>
								</button>
							</svelte:fragment>
						</DeleteUser>
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root> -->

		<span>
			{user.name}
		</span>

		{#if user.id}
			<span class="text-muted-foreground">
				#{user.id}
			</span>
		{/if}
	</Sheet.Title>

	<Sheet.Description>
		Created on
		{user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined}
	</Sheet.Description>

	{#if groups?.length}
		<div class="flex flex-wrap items-center gap-1.5">
			{#each groups as group}
				<Badge>{group}</Badge>
			{/each}
		</div>
	{/if}
</Sheet.Header>

<ul class="menu">
	<UserActions {users} {user} {policy} on:close={close} on:focus={() => dispatch('focus')} />
</ul>

<Sheet.Header>
	<Sheet.Title>Auth keys</Sheet.Title>
</Sheet.Header>

{#if keys.length}
	<div>
		{#each keys || [] as key}
			<div class="space-y-1.5 border-b px-1 py-3 first:pt-0 last:border-none">
				<div class="flex items-center gap-x-1.5 gap-y-2">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} variant="ghost" class="h-7 w-7 p-1.5">
								<EllipsisVertical class="h-4 w-4" />
							</Button>
						</DropdownMenu.Trigger>

						<DropdownMenu.Content align="start" class="min-w-64 max-w-96">
							<DropdownMenu.Group>
								<DropdownMenu.Item asChild>
									<ExpirePreAuthKey {key}>
										<svelte:fragment slot="trigger" let:builder>
											<button
												class="menu-button destructive"
												{...builder}
												use:builder.action
												disabled={!key.expiration || isExpired(key.expiration)}
											>
												<TimerOff class="mr-2 h-4 w-4" />
												<span>Expire</span>
											</button>
										</svelte:fragment>
									</ExpirePreAuthKey>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<Secret class="font-semibold" secret={key.key} />
				</div>

				<div class="flex flex-wrap items-center gap-x-1.5 gap-y-2">
					{#if key.expiration && isExpired(key.expiration)}
						<Badge variant="destructive">
							Expired {new Date(key.expiration).toDateString()}
						</Badge>
					{:else if key.expiration}
						<Badge variant="positive">
							Valid for {formatDuration(Date.now() - new Date(key.expiration).getTime())}
						</Badge>
					{/if}

					{#if key.createdAt}
						<Badge variant="outline">
							Created on {new Date(key.createdAt).toLocaleDateString()}
						</Badge>
					{/if}

					{#if key.used}
						<Badge variant="outline">Used</Badge>
					{/if}

					{#if key.reusable}
						<Badge variant="outline">Reusable</Badge>
					{/if}

					{#if key.ephemeral}
						<Badge variant="outline">Ephemeral</Badge>
					{/if}

					{#if key.aclTags?.length}
						{#each key.aclTags as tag}
							<Badge>{tag}</Badge>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div>
		<p class="w-full text-center text-sm text-muted-foreground">no auth keys found</p>
	</div>
{/if}
