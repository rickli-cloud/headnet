<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import { cn } from '$lib/utils/shadcn';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { base } from '$app/paths';

	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	const navItems: { href: string; title: string }[] = [
		{ href: base + '/settings', title: 'General' },
		{ href: base + '/settings/filters', title: 'Filters' },
		{ href: base + '/settings/appearance', title: 'Appearance' },
		{ href: base + '/settings/backup', title: 'Backup & restore' }
	];

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut
	});
</script>

<div class="space-y-6 p-10 pb-16">
	<div class="space-y-0.5">
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
	</div>

	<hr class="my-6" />

	<div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
		<aside class="-mx-4 lg:w-1/5">
			<nav class="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
				<Button
					href={base + '/'}
					variant="ghost"
					class="relative flex justify-start gap-1.5 hover:bg-transparent hover:underline"
					data-sveltekit-noscroll
				>
					<div>
						<ArrowLeft class="h-4 w-4" />
					</div>
					<div class="relative">Go back</div>
				</Button>

				{#each navItems as item}
					{@const isActive = $page.url.pathname === item.href}

					<Button
						href={item.href}
						variant="ghost"
						class={cn(
							!isActive && 'hover:underline',
							'relative justify-start hover:bg-transparent'
						)}
						data-sveltekit-noscroll
					>
						{#if isActive}
							<div
								class="absolute inset-0 rounded-md bg-muted"
								in:send={{ key: 'active-sidebar-tab' }}
								out:receive={{ key: 'active-sidebar-tab' }}
							></div>
						{/if}

						<div class="relative">
							{item.title}
						</div>
					</Button>
				{/each}
			</nav>
		</aside>

		<div class="flex-1 lg:max-w-2xl">
			<slot />
		</div>
	</div>
</div>
