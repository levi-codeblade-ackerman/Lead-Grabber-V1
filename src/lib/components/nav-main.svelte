<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import { Home, Users, ChartColumnBig, Smartphone, BookOpen, Settings } from "lucide-svelte";
	import { page } from "$app/stores";

	let items = $state([
		{ title: "Inbox", url: "/inbox", icon: Home, href: "/" },
		{ title: "Contacts", url: "/contacts", icon: Users, href: "/contacts" },
		{ title: "Reports", url: "/reports", icon: ChartColumnBig, href: "/reports" },
		{ title: "Leadbox", url: "/leadbox", icon: Smartphone, href: "/leadbox" },
		{ title: "Leadform", url: "/leadform", icon: BookOpen, href: "/leadform" },
		{ title: "Settings", url: "/settings", icon: Settings, href: "/settings" },
	]);

	const sidebar = useSidebar();
</script>

<Sidebar.Group>
	<Sidebar.Menu>
		{#each items as mainItem (mainItem.title)}
			<Sidebar.MenuItem class="gap-4 !text-5xl">
				<a 
					href={mainItem.href}
					class="w-full"
				>
					<Sidebar.MenuButton 
						class="!py-7 flex items-center gap-3 pl-9 hover:bg-white font-medium w-full {$page.url.pathname === mainItem.href ? 'bg-white text-primary' : ''}"
					>
						<mainItem.icon class="!w-6 !h-6" />
						{mainItem.title}
					</Sidebar.MenuButton>
				</a>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
