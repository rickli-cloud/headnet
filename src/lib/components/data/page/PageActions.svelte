<script>
	import { createEventDispatcher } from 'svelte';

	import Sliders from 'lucide-svelte/icons/sliders-horizontal';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Network from 'lucide-svelte/icons/network';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Braces from 'lucide-svelte/icons/braces';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Cog from 'lucide-svelte/icons/cog';
	import X from 'lucide-svelte/icons/x';

	import * as Sheet from '$lib/components/ui/sheet';

	import { base } from '$app/paths';

	const dispatch = createEventDispatcher();
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
	<Sheet.Root onOpenChange={(open) => (open ? void 0 : dispatch('close'))}>
		<Sheet.Trigger>
			<Plus />
			<span> User </span>
		</Sheet.Trigger>

		<Sheet.Content>
			<Sheet.Header>
				<Sheet.Title>Create user</Sheet.Title>
			</Sheet.Header>
		</Sheet.Content>
	</Sheet.Root>
</li>

<li>
	<Sheet.Root onOpenChange={(open) => (open ? void 0 : dispatch('close'))}>
		<Sheet.Trigger>
			<Plus />
			<span> Machine </span>
		</Sheet.Trigger>

		<Sheet.Content>
			<Sheet.Header>
				<Sheet.Title>Register machine</Sheet.Title>
			</Sheet.Header>
		</Sheet.Content>
	</Sheet.Root>
</li>

<hr />

<li>
	<button disabled>
		<Network />
		<span>Hosts</span>
	</button>
</li>

<li>
	<button disabled>
		<Users />
		<span>Groups</span>
	</button>
</li>

<li>
	<button disabled>
		<KeyRound />
		<span>Api keys</span>
	</button>
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
		<span>
			<Cog />
		</span>
		<span> Settings </span>
	</a>
</li>

<li class="destructive">
	<button>
		<LogOut />
		<span> Log out </span>
	</button>
</li>
