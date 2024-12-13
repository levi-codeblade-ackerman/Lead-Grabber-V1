<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import { Home, Users, ChartColumnBig, Smartphone, BookOpen, Settings, ChevronDown, ChevronUp, SquareSlash, Reply, Building } from "lucide-svelte";
	import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button/index";
	import { slide } from "svelte/transition";
	const { user } = $props();
	let isCompany = $state(user?.company_id && user?.company_id !== '');

	let items = $state([
		{ title: "Inbox", url: "/inbox", icon: Home, href: "/" },
		{ title: "Contacts", url: "/contacts", icon: Users, href: "/contacts" },
		{ title: "Reports", url: "/reports", icon: ChartColumnBig, href: "/reports" },
		{ title: "Leadbox", url: "/leadbox", icon: Smartphone, href: "/leadbox" },
		{ title: "Leadform", url: "/leadform", icon: BookOpen, href: "/leadform" },
		{ title: "Settings", url: "/settings", icon: Settings, href: "/settings", 
			subItems: [
				{ title: "Auto Replies", url: "/settings/auto-replies", icon: Reply, href: "/settings/auto-replies" },
				{ title: "Shortcuts", url: "/settings/shortcuts", icon: SquareSlash, href: "/settings/shortcuts" },
				...(isCompany ? [] : [{ title: "Create Company", url: "/create-company", icon: Building, href: "/create-company" }]),
				...(isCompany ? [{ title: "Company", url: "/settings/company", icon: Building, href: "/settings/company" }] : []),
			]
		 },
	]);

	const sidebar = useSidebar();
	let expanded = $state(false);
</script>

<Sidebar.Group>
	<Sidebar.Menu>
		{#each items as mainItem (mainItem.title)}
			<Sidebar.MenuItem class="gap-4 !text-5xl">
				<a 
					href={mainItem.href}
					class="w-full"
					onclick={(e) => {
						if (mainItem.subItems) {
							e.preventDefault();
							e.stopPropagation();
							expanded = !expanded;
						}
					}}
				>
					<Sidebar.MenuButton 
						class="!py-7 flex items-center gap-3 pl-9 hover:bg-white font-medium w-full {$page.url.pathname === mainItem.href ? 'bg-white text-primary' : ''}"
					>
						<mainItem.icon class="!w-6 !h-6" />
						{mainItem.title}
						{#if mainItem.subItems}
							<Button variant="ghost" class="ml-auto">
								{#if expanded}
									<ChevronUp class="w-5 h-5 ml-auto" />
								{:else}
									<ChevronDown class="w-5 h-5 ml-auto" />
								{/if}
							</Button>
						{/if}
					</Sidebar.MenuButton>
				</a>
			</Sidebar.MenuItem>

			{#if mainItem.subItems && expanded}
			<div transition:slide>
				{#each mainItem.subItems as subItem}
				
						<Sidebar.MenuItem class="gap-4 !text-5xl" >
							<a href={subItem.href} class="w-full">
							<Sidebar.MenuButton class="!py-7 flex items-center gap-3 pl-14 hover:bg-white font-medium w-full {$page.url.pathname === subItem.href ? 'bg-white text-primary' : ''}">
								<subItem.icon class="!w-6 !h-6" />
								{subItem.title}
							</Sidebar.MenuButton>
							</a>
						</Sidebar.MenuItem>
					
				{/each}
				</div>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
