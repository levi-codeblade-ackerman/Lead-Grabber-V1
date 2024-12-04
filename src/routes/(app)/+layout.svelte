<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { MessageSquareText, Search } from 'lucide-svelte';
	let { children } = $props();

</script>

<Sidebar.Provider>
	<AppSidebar/>
	<Sidebar.Inset class="border-none">
		<header class="flex py-4 shrink-0 items-center gap-2 border-b px-4 border-none">
            <div class="flex px-6 py-3 bg-white w-full rounded-lg justify-between">
                <div class="flex items-center gap-2">
                    <img src="/icons/valid-shield.svg" alt="Valid Shield" />
                    <h1 class="text-xl font-semibold">Canadian Trade-Ex</h1>
                </div>
                <div class="flex items-center">
                    <div class="flex items-center bg-gray-50 rounded-full border border-foreground">
                        <div class="flex items-center pl-4">
                            <Search class="w-5 h-5 text-foreborder-foreground" />
                        </div>
                        <input 
                            type="search" 
                            placeholder="Search.." 
                            class="px-4 py-2 rounded-full text-foreborder-foreground bg-gray-50 border-none focus:outline-none  w-[528px]"
                        />
                        <button class="px-3 py-2 hover:bg-gray-100 border-l border-[#565656] rounded-r-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
             
                  
                    
                    <div class="flex items-center gap-6">
                        <div class="relative">
                           <MessageSquareText class="w-5 h-5 text-[#565656]"/>
                            <span class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">2</span>
                        </div>
                        <button class="flex items-center gap-1 px-2 py-1 rounded-full bg-foreground h-9 w-9 text-white">
                            <span>RD</span>
                        </button>
                    </div>
               
            </div>
		</header>
		<main class="bg-background px-4">{@render children()}</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
    main {
        @apply bg-root-background;
    }
</style>