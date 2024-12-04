<script>
	import HeaderClose from "$lib/components/header-close.svelte";
	import HeaderReminder from "$lib/components/header-reminder.svelte";
	import HeaderShuffle from "$lib/components/header-shuffle.svelte";
import HeaderTag from "$lib/components/header-tag.svelte";
      import { Button } from "$lib/components/ui/button/index";
      import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
      import { Bell, CheckCircle2, Images, MessageSquareText, Plus, Shuffle, Smile, Tag } from "lucide-svelte";

      // Add message data
      const messages = [
          {
              initials: "RD",
              name: "Rory Dredhart",
              message: "Hello guys",
              time: "10:20PM",
              color: "bg-primary"
          },
          {
              initials: "CG",
              name: "Cris George",
              message: "Hello guys",
              time: "10:20PM",
              color: "bg-primary"
          },
          {
              initials: "JP",
              name: "Jake Paul",
              message: "Hi nice to meet you",
              time: "08:45PM",
              color: "bg-primary"
          }
      ];

      let showMessages = true;

// Add chat messages
const chatMessages = [
    {
        sender: "John",
        message: "Hello John",
        time: "Just now",
        isYou: false
    },
    {
        sender: "You",
        message: "Sure thing, I'll have a look today. They're looking great!",
        time: "Just now",
        isYou: true
    },
    {
        sender: "John Max",
        message: "Hey Olivia, can you please review the latest design when you can?",
        time: "Today 2:20pm",
        isYou: false
    },
    
];
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="h1 font-semibold text-2xl">Inbox</div>
    
    <div class="w-full h-[61px] bg-white rounded-lg px-8 flex items-center justify-between">
        <h3 class="text-xl font-normal leading-8">
            All
        </h3>
        <div class="actions flex items-center gap-2">
           
          <HeaderTag />
          <HeaderShuffle />
           <HeaderReminder />
          <HeaderClose />
        </div>
    </div>

    <div class="flex-1 flex gap-5 min-h-0">
        <div class="w-1/2 bg-white rounded-xl flex flex-col">
            <div class="flex-1 overflow-y-auto">
                <div class="flex flex-col divide-y px-5">
                    {#each messages as msg}
                        <div class="flex items-center gap-4 py-4">
                            <div class="flex-shrink-0">
                                <div class="w-14 h-14 rounded-full {msg.color} text-white flex items-center justify-center text-xl">
                                    {msg.initials}
                                </div>
                            </div>
                            <div class="flex-grow">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-lg font-medium">{msg.name}</h4>
                                    <span class="font-medium">{msg.time}</span>
                                </div>
                                <p class="font-light">{msg.message}</p>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="w-1/2 bg-white rounded-xl flex flex-col">
            <div class="flex-1 overflow-y-auto">
                {#if showMessages}
                    <div class="flex flex-col gap-4 p-4">
                        {#each chatMessages as msg}
                            <div class="flex flex-col {msg.isYou ? 'items-end' : 'items-start'}">
                                <div class="max-w-[80%]">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="font-medium">{msg.sender}</span>
                                        <span class="text-sm text-gray-500">{msg.time}</span>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        {#if !msg.isYou}
                                            <div class="w-10 h-10 rounded-full bg-[#F3F3F3] flex-shrink-0"></div>
                                        {/if}
                                        <div class="rounded-b-xl p-3 text-[#101828] {msg.isYou ? 'bg-[#EAEDFB] rounded-tr-none rounded-tl-xl' : 'bg-[#F3F3F3] rounded-tr-xl rounded-tl-none'}">
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="flex-1 flex items-center justify-center">
                        <div class="text-center">
                            <div class="mb-2">
                                <MessageSquareText class="w-16 h-16 mx-auto opacity-50" />
                            </div>
                            <p>No conversation selected.</p>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="border-t p-4">
                <div class="flex gap-4 mb-4">
                    <button class="text-primary border-b-2 border-primary pb-2">Message</button>
                    <button class=" pb-2">Note</button>
                </div>
                <div class="w-full">
                    <input type="text" placeholder="Type a message..." class="flex-1 bg-transparent py-3 focus:outline-none w-full">
                </div>
                <div class="flex gap-2 ">
                    <div class="flex items-center gap-2 rounded-lg  w-full justify-between">
                        <div class="flex items-center gap-6">
                          
                                <Smile class="h-5 w-5 " />
                           
                          
                                <Images class="h-5 w-5 " />
                           
                        </div>
                        <Button class="bg-primary hover:bg-blue-700 text-white px-6 text-sm font-semibold">
                            SEND
                        </Button>
                    </div>
                  
                </div>
            </div>
        </div>
    </div>
</div>
