<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import { Edit3, Facebook, Instagram } from "lucide-svelte";
    import * as Dialog from "$lib/components/ui/dialog/index";

</script>
<Dialog.Content class="!w-[682px] bg-dialog px-10 pt-10 pb-4">
    <Dialog.Header>
      <Dialog.Title class="py-4">Rory Dredhart</Dialog.Title>
      <div class="flex flex-col gap-11">
        <div class="flex flex-col gap-2">
            <div class="flex items-center gap-4">
                <span class="w-20 text-sm">Name:</span>
                <input type="text" value="Rory" class="bg-transparent border-b border-gray-300 outline-none w-48" />
                <input type="text" value="Dredhart" class="bg-transparent border-b border-gray-300 outline-none w-48 ml-2" />
            </div>
            
            <div class="flex items-center gap-4">
                <span class="w-20 text-sm">SMS:</span>
                <input type="tel" value="(705) 264-2251" class="bg-transparent border-b border-gray-300 outline-none text-blue-500" />
            </div>
            
            <div class="flex items-center gap-4">
                <span class="w-20 text-sm">Email:</span>
                <input type="email" value="r.dredharrt@canadiantradex.com" class="bg-transparent border-b border-gray-300 outline-none text-blue-500" />
            </div>
            <div class="flex flex-col gap-4">
                <span class="w-20 text-sm">Channels:</span>
                <div class="flex gap-2 items-center">
                    <Facebook class="w-6 h-6" />
                    <Instagram class="w-6 h-6" />
                </div>
            </div>
        </div>

        <div class="mt-8">
            <h2 class="text-xl  mb-4">History</h2>
            <div class="bg-gray-50 rounded-lg p-6  border border-dashed border-[#858585]">
                <div class="flex justify-between items-center mb-4">
                    <span class="">Nov 27, 2024</span>
                    <div class="flex items-center gap-2">
                        <span class="bg-neutral-100 text-white px-3 py-1 rounded-md text-sm">Closed</span>
                        <button class="p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                    </div>
                </div>
                
                <div class="mb-4">
                    <span class="bg-neutral-100 text-white px-3 py-1 rounded-md text-sm">Canadian Trade-Ex</span>
                </div>
                
                <div class="flex gap-2 items-center">
                    <span class="text-neutral-100">Assignee</span>
                    <span class="text-neutral-200">Rory Dredhart</span>
                </div>
                
                <a href="#" class="text-blue-600 hover:underline block mt-4">View full conversation</a>
            </div>
        </div>
        <Button class=" ml-auto">Save Changes</Button>

    </div>
    </Dialog.Header>
</Dialog.Content>