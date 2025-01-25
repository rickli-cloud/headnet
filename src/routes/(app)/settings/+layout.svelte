<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	import Sliders from 'lucide-svelte/icons/sliders-horizontal';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Braces from 'lucide-svelte/icons/braces';
	import Cog from 'lucide-svelte/icons/cog';

	import { Button } from '$lib/components/ui/button';

	import { cn } from '$lib/utils/shadcn';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import EndSession from '$lib/components/data/page/EndSession.svelte';

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

<div class="h-full min-w-[512px] space-y-6 overflow-scroll p-10 pb-16">
	<div class="space-y-0.5">
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
	</div>

	<hr class="my-6" />

	<!-- <div class="flex h-full flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0"> -->
	<div
		class="flex h-full flex-col gap-y-6 lg:grid lg:grid-cols-[256px,1fr] lg:grid-rows-[100] lg:gap-x-6"
		style="grid-template-areas: nav content;"
	>
		<aside>
			<nav class="grid gap-y-1.5">
				{#each navItems as item}
					{@const isActive = $page.url.pathname === item.href}

					<Button
						href={item.href}
						variant="ghost"
						class="relative justify-start"
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

				<EndSession>
					<svelte:fragment slot="trigger" let:builder>
						<Button
							variant="ghost"
							class="relative justify-start"
							data-sveltekit-noscroll
							builders={[builder]}
						>
							<div class="relative flex items-center gap-1.5">
								<LogOut class="h-4 w-4" />

								<span> Log out </span>
							</div>
						</Button>
					</svelte:fragment>
				</EndSession>
			</nav>
		</aside>

		<!-- <div class="flex-1 space-y-6"></div> -->

		<slot />
	</div>
</div>
