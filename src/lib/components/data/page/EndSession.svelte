<script lang="ts">
	import ConfirmAction from '$lib/components/utils/ConfirmAction.svelte';

	import { endSession } from '$lib/store/session';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	function handleSubmit() {
		endSession();
		goto(base + '/auth');
	}
</script>

<ConfirmAction
	title="End session?"
	description="Remove all session data and return to the login page"
	on:submit={handleSubmit}
	confirm={false}
	destructive
>
	<svelte:fragment slot="trigger" let:builder>
		<slot name="trigger" {builder} />
	</svelte:fragment>
</ConfirmAction>

<!-- <script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';

	import { endSession } from '$lib/store/session';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	export let isOpen: boolean = false;

	export function open() {
		isOpen = true;
	}
</script>

<AlertDialog.Root bind:open={isOpen}>
	<AlertDialog.Trigger asChild let:builder>
		<slot name="trigger" {builder} />
	</AlertDialog.Trigger>

	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>End session?</AlertDialog.Title>
			<AlertDialog.Description>
				Removes all session data and returns you to the login page.
			</AlertDialog.Description>
		</AlertDialog.Header>

		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				on:click={() => {
					isOpen = false;
					endSession();
					goto(base + '/auth');
				}}
				class={buttonVariants({ variant: 'destructive' })}
			>
				Continue
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root> -->
