<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import { ArrowRight, Edit } from "lucide-svelte";
    import { toast } from 'svelte-sonner';

    let teamShortcuts = [
        { id: 1, trigger: "23", message: "Test 1234123123123213" }
    ];

    let personalShortcuts = [];

    function addPersonalShortcut() {
        personalShortcuts = [
            ...personalShortcuts,
            { id: Date.now(), trigger: "", message: "" }
        ];
    }
</script>

<div class="p-6 bg-gray-50">
    <h1 class="text-2xl font-semibold mb-6">Shortcuts</h1>

    <!-- Team Shortcuts -->
    <div class="mb-8">
        <h2 class="text-xl font-semibold text-primary mb-2">Team shortcuts</h2>
        <p class="text-gray-500 mb-4">Share team shortcuts to all your team members accessing this profile.</p>
        
        <div class="border-t max-w-[600px]">
            <div class="flex justify-between items-center py-4">
                <h3 class="text-lg font-semibold">Shortcut</h3>
                <p class="text-sm font-medium">Message <span class="opacity-70">(255 character limit per shortcut)</span></p>
            </div>
            {#each teamShortcuts as shortcut}
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center gap-4">
                        <div class="font-medium flex items-center gap-3">
                            <div class=" h-8 w-7 bg-slate-200  flex items-center justify-center font-bold">/</div>
                            {shortcut.trigger}
                        </div>
                      
                    </div>
                    <div class="flex items-center gap-4">
                        <ArrowRight class="h-4 w-4 text-red-500" />
                        <span class="text-gray-700">{shortcut.message}</span>

                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Personal Shortcuts -->
    <div>
        <h2 class="text-xl font-semibold text-primary mb-2">Personal shortcuts</h2>
        <p class="text-gray-500 mb-4">Create and personalize shortcuts to use across all profiles.</p>
        
        <div class="border-t max-w-[600px]">
            <div class="flex justify-between items-center py-4">
                <h3 class="text-lg font-semibold">Personal Shortcut</h3>
                <p class="text-sm font-medium">Message <span class="opacity-70">(255 character limit per shortcut)</span></p>
            </div>
            {#each personalShortcuts as shortcut}
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center gap-4">
                        <span class="font-medium">/{shortcut.trigger}</span>
                        <Edit class="text-red-500" />
                    </div>
                    <span class="text-gray-700">{shortcut.message}</span>
                </div>
            {/each}

            {#if personalShortcuts.length === 0}
                <div class="py-4">
                    <a href="#" class="text-primary hover:underline" onclick={addPersonalShortcut}>
                        Add your first personal shortcut
                    </a>
                </div>
            {/if}
        </div>
    </div>
</div> 