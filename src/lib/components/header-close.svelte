<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { CheckCircle2 } from "lucide-svelte";
</script>

<Dialog.Root >
    <Dialog.Trigger>
        <Button variant="ghost" class="hover:bg-transparent">
            <CheckCircle2 class="text-3xl" size="33" />
        </Button>
    </Dialog.Trigger>
    <Dialog.Content class="!w-[682px] bg-dialog">

        
        <Dialog.Header class="flex flex-col gap-2">
            <Dialog.Title class="text-center text-2xl font-medium text-gray-700">Close Conversation</Dialog.Title>
            <div class="text-center text-sm text-muted-foreground">
                Select one of the options below as to why this lead is being closed.
            </div>
            <div class="text-center font-medium mt-1">
                Rory
            </div>
        </Dialog.Header>

        <div class="mt-6">
            <div class="text-gray-700 mb-2">Conversation Summary:</div>
            <textarea 
                placeholder="Summarize the Conversation"
                class="w-full rounded-lg border border-gray-200 p-4 bg-white text-gray-500 placeholder:text-gray-400 min-h-[120px]"
            />
        </div>

        <div class="mt-6 flex gap-4 justify-center">
            <button class="px-12 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90">
                WON
            </button>
            <button class="px-12 py-2.5 rounded-lg border border-primary text-primary font-medium hover:bg-primary/5">
                Last
            </button>
            <button class="px-12 py-2.5 rounded-lg border border-primary text-primary font-medium hover:bg-primary/5">
                Other
            </button>
        </div>
    </Dialog.Content>
</Dialog.Root>

