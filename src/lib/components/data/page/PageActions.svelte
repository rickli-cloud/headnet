<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import Sliders from 'lucide-svelte/icons/sliders-horizontal';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Terminal from 'lucide-svelte/icons/terminal';
	import Network from 'lucide-svelte/icons/network';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Braces from 'lucide-svelte/icons/braces';
	import Users from 'lucide-svelte/icons/users';
	import Lock from 'lucide-svelte/icons/lock';
	import Plus from 'lucide-svelte/icons/plus';
	import Cog from 'lucide-svelte/icons/cog';
	import Tag from 'lucide-svelte/icons/tag';
	import X from 'lucide-svelte/icons/x';

	import AccessControlInfo from '$lib/components/data/acl/AccessControlInfo.svelte';
	import ApikeyInfo from '$lib/components/data/apikey/ApikeyInfo.svelte';
	import CreateUser from '$lib/components/data/user/CreateUser.svelte';
	import TagInfo from '$lib/components/data/tag/TagInfo.svelte';

	import type { Acl, Machine, User } from '$lib/api';
	import { base } from '$app/paths';

	import MachineAndHostInfo from '../host/HostInfo.svelte';
	import UserAndGroupInfo from './UserAndGroupInfo.svelte';
	import EndSession from './EndSession.svelte';

	export let acl: Acl;
	export let users: User[] | undefined;
	export let machines: Machine[] | undefined;

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
	<AccessControlInfo {acl} {users} on:close>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Lock />
				<span>Access control</span>
			</button>
		</svelte:fragment>
	</AccessControlInfo>
</li>

<li>
	<UserAndGroupInfo {acl} {users} on:close>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Users />
				<span>Users, Groups</span>
			</button>
		</svelte:fragment>
	</UserAndGroupInfo>
</li>

<li>
	<MachineAndHostInfo {machines} {acl}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Network />
				<span>Hosts</span>
			</button>
		</svelte:fragment>
	</MachineAndHostInfo>
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
	<ApikeyInfo on:close>
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
