<script lang="ts" module>

</script>

<script lang="ts">
	import NavMain from "$lib/components/nav-main.svelte";
	import SidebarOptInForm from "$lib/components/sidebar-opt-in-form.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import GalleryVerticalEnd from "lucide-svelte/icons/gallery-vertical-end";
	import type { ComponentProps } from "svelte";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<img src="/icons/main-logo.svg" alt="Bits UI" class="w-[160px] py-12 mx-auto" />
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain />
	</Sidebar.Content>
	<Sidebar.Footer>

	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
