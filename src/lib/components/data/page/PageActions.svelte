<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import Sliders from 'lucide-svelte/icons/sliders-horizontal';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Network from 'lucide-svelte/icons/network';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Braces from 'lucide-svelte/icons/braces';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Cog from 'lucide-svelte/icons/cog';
	import Tag from 'lucide-svelte/icons/tag';
	import X from 'lucide-svelte/icons/x';

	import CreateUser from '$lib/components/data/user/CreateUser.svelte';
	import EndSession from './EndSession.svelte';

	import { base } from '$app/paths';
	import type { Acl } from '$lib/api';
	import ApikeyInfo from '../apikey/ApikeyInfo.svelte';
	import GroupInfo from '../group/GroupInfo.svelte';

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
		<span>Hosts</span>
	</button>
</li>

<li>
	<GroupInfo groups={acl?.groups}>
		<svelte:fragment slot="trigger" let:builder>
			<button {...builder} use:builder.action>
				<Users />
				<span>Groups</span>
			</button>
		</svelte:fragment>
	</GroupInfo>
</li>

<li>
	<button disabled>
		<Tag />
		<span> Tags </span>
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

<li>
	<button disabled>
		<Braces />
		<span>Policy</span>
	</button>
</li>

<hr />

<li>
	<button disabled>
		<Sliders />
		<span> Filters </span>
	</button>
</li>

<li>
	<a href="{base}/settings">
		<Cog />
		<span> Settings </span>
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
