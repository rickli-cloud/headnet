<script lang="ts">
	import Settings from 'lucide-svelte/icons/settings-2';
	import Trash from 'lucide-svelte/icons/trash-2';
	import Plus from 'lucide-svelte/icons/plus';

	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	import { type User, type Acl } from '$lib/api';
	import EditUser from '../user/EditUser.svelte';
	import DeleteUser from '../user/DeleteUser.svelte';
	import CreateUser from '../user/CreateUser.svelte';
	import CreateGroup from '../group/CreateGroup.svelte';

	export let users: User[] | undefined;
	export let acl: Acl | undefined;

	function findGroups(user: User) {
		return acl?.groups
			.filter((group) => user.name && group.members.includes(user.name))
			.map(({ name }) => name);
	}
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</Sheet.Trigger>

	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Users, Groups</Sheet.Title>
			<Sheet.Description>
				Groups can be used to ease policy management and standardize permissions
			</Sheet.Description>
		</Sheet.Header>

		<ul class="menu">
			<li>
				<CreateUser {acl}>
					<svelte:fragment slot="trigger" let:builder>
						<button {...builder} use:builder.action>
							<Plus />
							<span> User </span>
						</button>
					</svelte:fragment>
				</CreateUser>
			</li>

			<li>
				<CreateGroup {acl} {users}>
					<svelte:fragment slot="trigger" let:builder>
						<button {...builder} use:builder.action>
							<Plus />
							<span> Group </span>
						</button>
					</svelte:fragment>
				</CreateGroup>
			</li>
		</ul>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-10"></Table.Head>
					<Table.Head>User</Table.Head>
					<Table.Head>Groups</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each users || [] as user}
					{@const groups = findGroups(user)}

					<Table.Row>
						<Table.Cell class="pr-0.5">
							<div class="flex h-6 items-center">
								<EditUser {user} {acl}>
									<svelte:fragment slot="trigger" let:builder>
										<button
											{...builder}
											use:builder.action
											class="link mr-1.5 text-muted-foreground hover:text-current"
										>
											<Settings class="h-4 w-4" />
										</button>
									</svelte:fragment>
								</EditUser>

								<DeleteUser {user} {acl}>
									<svelte:fragment slot="trigger" let:builder>
										<button
											{...builder}
											use:builder.action
											class="link text-muted-foreground hover:text-red-600"
										>
											<Trash class="h-4 w-4" />
										</button>
									</svelte:fragment>
								</DeleteUser>
							</div>
						</Table.Cell>

						<Table.Cell>
							<p class="h-6 whitespace-nowrap font-semibold" style="line-height: 24px;">
								<button class="link">
									{user.name}

									{#if user.id}
										<span class="text-muted-foreground">
											#{user.id}
										</span>
									{/if}
								</button>
							</p>
						</Table.Cell>

						<Table.Cell>
							<div class="flex flex-wrap gap-1.5 py-[1px]">
								{#each groups || [] as member}
									<Badge>
										{member}
									</Badge>
								{/each}
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<slot />
	</Sheet.Content>
</Sheet.Root>
