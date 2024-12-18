<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import Sliders from 'lucide-svelte/icons/sliders-horizontal';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Terminal from 'lucide-svelte/icons/terminal';
	import Network from 'lucide-svelte/icons/network';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Braces from 'lucide-svelte/icons/braces';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Cog from 'lucide-svelte/icons/cog';
	import Tag from 'lucide-svelte/icons/tag';
	import X from 'lucide-svelte/icons/x';

	import CreateUser from '$lib/components/data/user/CreateUser.svelte';
	import ApikeyInfo from '$lib/components/data/apikey/ApikeyInfo.svelte';
	import TagInfo from '$lib/components/data/tag/TagInfo.svelte';
	import UserAndGroupInfo from './UserAndGroupInfo.svelte';
	import EndSession from './EndSession.svelte';

	import type { Acl, User } from '$lib/api';
	import { base } from '$app/paths';

	export let users: User[] | undefined;
	export let acl: Acl | undefined;

	const dispatch = createEventDispatcher<{ close: undefined }>();
</script>

<div class="grid items-center gap-2" style="grid-template-columns: 1fr auto;">
	<span>Quick actions</span>
	<button
		class="-my-1.5 -mr-2 h-8 w-8 rounded p-2 hover:bg-muted"
		on:click={() => dispatch('close')}
	>
		<X class="h-4 w-4" />
	</button>
</div>
<hr />

<li>
	<CreateUser {acl} on:submit={() => dispatch('close')}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Plus />
				<span> User </span>
			</button>
		</svelte:fragment>
	</CreateUser>
</li>

<li>
	<button disabled>
		<Plus />
		<span> Machine </span>
	</button>
</li>

<hr />

<li>
	<button disabled>
		<Network />
		<span>Machines, Hosts</span>
	</button>
</li>

<li>
	<UserAndGroupInfo {acl} {users} on:close={() => dispatch('close')}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Users />
				<span>Users, Groups</span>
			</button>
		</svelte:fragment>
	</UserAndGroupInfo>
</li>

<li>
	<TagInfo {acl}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Tag />
				<span> Tags </span>
			</button>
		</svelte:fragment>
	</TagInfo>
</li>

<li>
	<button disabled>
		<Terminal />
		<span>SSH</span>
	</button>
</li>

<li>
	<ApikeyInfo on:submit={() => dispatch('close')}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<KeyRound />
				<span>API keys</span>
			</button>
		</svelte:fragment>
	</ApikeyInfo>
</li>

<hr />

<li>
	<a href="{base}/settings">
		<Cog />
		<span> Settings </span>
	</a>
</li>

<li>
	<a href="{base}/settings/filters">
		<Sliders />
		<span> Filters </span>
	</a>
</li>

<li>
	<a href="{base}/settings/policy">
		<Braces />
		<span> Policy </span>
	</a>
</li>

<li class="destructive">
	<EndSession>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<LogOut />
				<span> Log out </span>
			</button>
		</svelte:fragment>
	</EndSession>
</li>
