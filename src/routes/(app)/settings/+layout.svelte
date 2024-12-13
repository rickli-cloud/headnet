<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	import Sliders from 'lucide-svelte/icons/sliders-horizontal';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Braces from 'lucide-svelte/icons/braces';
	import Cog from 'lucide-svelte/icons/cog';

	import { Button } from '$lib/components/ui/button';

	import { cn } from '$lib/utils/shadcn';
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	const navItems: { href: string; title: string; icon: ConstructorOfATypedSvelteComponent }[] = [
		{ href: base + '/', title: 'Go back', icon: ArrowLeft },
		{ href: base + '/settings', title: 'General', icon: Cog },
		{ href: base + '/settings/filters', title: 'Filters', icon: Sliders },
		{ href: base + '/settings/policy', title: 'Policy', icon: Braces }
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

						<div class="relative flex items-center gap-1.5">
							<svelte:component this={item.icon} class="h-4 w-4" />

							<span>
								{item.title}
							</span>
						</div>
					</Button>
				{/each}
			</nav>
		</aside>

		<div class="flex-1 space-y-6">
			<slot />
		</div>
	</div>
</div>
