<script lang="ts">
	import { browser } from '$app/environment';
	import * as Sidebar from "$lib/components/ui/sidebar/index";
	
	let { data } = $props();
	let { user } = data;
	
	// Dynamically import heavy components
	const AppSidebar = browser 
		? import('$lib/components/app-sidebar.svelte').then(m => m.default)
		: null;
</script>

<Sidebar.Provider>
	{#await AppSidebar then Sidebar}
		{#if Sidebar}
			<svelte:component this={Sidebar} {user} />
		{/if}
	{/await}

	<Sidebar.Inset>
		<main class="bg-background px-4">
			<slot />
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
    main {
        @apply bg-root-background;
    }
</style>