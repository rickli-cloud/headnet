<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { endSession } from '$lib/store/session';
	import { Description } from 'formsnap';

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
			>
				Continue
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
