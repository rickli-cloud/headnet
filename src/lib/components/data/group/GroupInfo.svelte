<script lang="ts">
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';

	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	import { type User, type Policy } from '$lib/api';
	import CreateUser from '../user/CreateUser.svelte';
	import CreateGroup from '../group/CreateGroup.svelte';
	import CreatePreAuthKey from '../preAuthKey/CreatePreAuthKey.svelte';
	import EditGroup from '../group/EditGroup.svelte';

	export let users: User[] | undefined;
	export let policy: Policy;

	function findGroups(user: User): string[] {
		return policy.groups
			? Object.entries(policy.groups)
					.filter(([name, members]) => members.includes(user.name as string))
					.map(([name]) => name)
			: [];
	}
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Groups</Sheet.Title>
			<Sheet.Description>Standardize permissions and ease policy management</Sheet.Description>
		</Sheet.Header>

		<ul class="menu">
			<li>
				<CreateUser {policy}>
					<svelte:fragment slot="trigger" let:builder>
						<button {...builder} use:builder.action>
							<Plus />
							<span> User </span>
						</button>
					</svelte:fragment>
				</CreateUser>
			</li>

			<li>
				<CreateGroup {policy} {users}>
					<svelte:fragment slot="trigger" let:builder>
						<button {...builder} use:builder.action>
							<Plus />
							<span> Group </span>
						</button>
					</svelte:fragment>
				</CreateGroup>
			</li>

			<li>
				<CreatePreAuthKey {policy} {users}>
					<svelte:fragment slot="trigger" let:builder>
						<button {...builder} use:builder.action>
							<Plus />
							<span> Auth Key </span>
						</button>
					</svelte:fragment>
				</CreatePreAuthKey>
			</li>
		</ul>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-10"></Table.Head>
					<Table.Head>Group</Table.Head>
					<Table.Head>Members</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each Object.keys(policy.groups || {}) || [] as group}
					<!-- {@const groups = findGroups(user)} -->

					<Table.Row>
						<Table.Cell class="pr-0.5">
							<div class="flex h-6 items-center">
								<EditGroup {policy} {users} {group}>
									<svelte:fragment slot="trigger" let:builder>
										<button
											{...builder}
											use:builder.action
											class="link mr-1.5 text-muted-foreground hover:text-current"
										>
											<Settings class="h-4 w-4" />
										</button>
									</svelte:fragment>
								</EditGroup>

								<button class="link text-muted-foreground hover:text-red-600">
									<Trash class="h-4 w-4" />
								</button>
							</div>
						</Table.Cell>

						<Table.Cell>
							<p class="h-6 whitespace-nowrap font-semibold" style="line-height: 24px;">
								{group}
							</p>
						</Table.Cell>

						<Table.Cell>
							{policy.groups?.[group]?.length || '?'}

							<!-- <div class="flex flex-wrap gap-1.5 py-[1px]">
								{#each group.members || [] as member}
									<Badge>
										{member}
									</Badge>
								{/each}
							</div> -->
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<slot />
	</Sheet.Content>
</Sheet.Root>
