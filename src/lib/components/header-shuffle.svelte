<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Shuffle, Search } from "lucide-svelte";
</script>

<Dialog.Root>
    <Dialog.Trigger>
        <Button variant="ghost" class="hover:bg-transparent">
            <Shuffle class="text-3xl" size="33" />
        </Button>
    </Dialog.Trigger>
    <Dialog.Content class="!w-[682px] bg-dialog">
        <Dialog.Header class="flex flex-col gap-3">
            <Dialog.Title class="text-center text-xl font-medium">Transfer</Dialog.Title>
            <div class="text-center text-sm text-muted-foreground">
                Conversation with <span class="font-medium">Rory</span> to:
            </div>
            <div class="text-center text-sm text-muted-foreground">
                Profile: <span class="font-medium">Canadian Trade-Ex</span>
            </div>
        </Dialog.Header>
        
        <div class="relative mt-6">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
                type="text" 
                placeholder="Filter by name"
                class="w-full rounded-md border border-[#C3C3C3] pl-9 py-2 bg-transparent"
            />
        </div>

        <div class="mt-4 space-y-2">
            <div class="flex items-center justify-between rounded-lg border border-green-500 p-3 bg-white">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                        U
                    </div>
                    <span>Unassigned</span>
                </div>
                <div class="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
            </div>

            <div class="flex items-center gap-3 rounded-lg p-3 bg-white">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                    RD
                </div>
                <span>Rory Dredhart</span>
            </div>
        </div>

        <Button class="mt-6 w-fit mx-auto bg-primary hover:bg-primary/80 text-white">
            TRANSFER
        </Button>
    </Dialog.Content>
</Dialog.Root>
