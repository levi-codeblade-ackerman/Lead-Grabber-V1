<script lang="ts">
	import HeaderClose from "$lib/components/header-close.svelte";
	import HeaderReminder from "$lib/components/header-reminder.svelte";
	import HeaderShuffle from "$lib/components/header-shuffle.svelte";
import HeaderTag from "$lib/components/header-tag.svelte";
      import { Button } from "$lib/components/ui/button/index";
      import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
      import { Bell, CheckCircle2, Images, MessageSquareText, Plus, Shuffle, Smile, Tag, UserPlus } from "lucide-svelte";
      import { onMount, onDestroy } from 'svelte';
      import { pb } from '$lib/pocketbase';

      let { data } = $props();
      
      // Add message data store
      let messages = $state<{
        initials: string;
        name: string;
        message: string;
        time: string;
        color: string;
        id: string;
        thread_id: string;
        created: string;
        assigned_to: string;
      }[]>([]);
      let selectedMessage = $state<{
        thread_id: string;
        [key: string]: any;
      } | null>(null);
      let showMessages = $state(true);
      let chatMessages = $state<{
        sender: string;
        message: string;
        phone?: string;
        email?: string;
        time: string;
        isYou: boolean;
      }[]>([]);

      // Remove the unsubscribe variable declaration and replace with polling interval
      let pollInterval: number;

      // Add these state variables near the top with other state declarations
      let isLoadingMessages = $state(true);
      let isLoadingChat = $state(false);

      // Add this state variable with the other state declarations
      let companyMembers = $state<{id: string, name: string}[]>([]);

      // Add a new state variable for initial load
      let initialLoad = $state(true);

      onMount(async () => {
        try {
          // Initial load of messages
          await loadMessages();
          await loadCompanyMembers();
          
          // Set up polling every 5 seconds
          pollInterval = setInterval(async () => {
            await loadMessages();
          }, 5000);

        } catch (err) {
          console.error('Error in onMount:', err);
        }
      });

      // Add onDestroy cleanup
      onDestroy(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      });

      // Add loadMessages function
      async function loadMessages() {
        // Only show loading state on initial load
        if (initialLoad) {
          isLoadingMessages = true;
        }
        
        try {
          const records = await pb.collection('messages').getList(1, 50, {
            sort: '-created',
            filter: `company_id = "${data.user?.company_id}"`,
            expand: 'customer_id'
          });

          const formattedMessages = records.items.map(formatMessage);
          messages = formattedMessages;

          if (selectedMessage) {
            if (initialLoad) {
              isLoadingChat = true;
            }
            try {
              const chatRecords = await pb.collection('messages').getList(1, 50, {
                sort: 'created',
                filter: `thread_id = "${selectedMessage.thread_id}"`,
                expand: 'customer_id'
              });

              chatMessages = chatRecords.items.map(formatChatMessage);
            } finally {
              isLoadingChat = false;
            }
          }

        } catch (err) {
          console.error('Error loading messages:', err);
        } finally {
          isLoadingMessages = false;
          initialLoad = false; // Set initial load to false after first load
        }
      }

      // Helper function to format message consistently
      function formatMessage(msg: any) {
        return {
          initials: msg.initials || (msg.customer_name?.split(' ').map((n: string) => n[0]).join('') || '??'),
          name: msg.customer_name || 'Unknown',
          message: msg.message,
          time: new Date(msg.created).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          color: msg.color || 'bg-primary',
          id: msg.id,
          thread_id: msg.thread_id,
          created: msg.created,
          assigned_to: msg.assigned_to,
        };
      }

      // Helper function to format chat message
      function formatChatMessage(chat: any) {
        return {
          sender: chat.customer_name || 'Unknown',
          message: chat.message,
          phone: chat.customer_phone || '',
          email: chat.customer_email || '',
          time: new Date(chat.created).toLocaleString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
          }),
          isYou: chat.company_id === data.user?.company_id
        };
      }

      // Function to select a message and load its chat history
      async function selectMessage(msg: { thread_id: string; [key: string]: any }) {
        selectedMessage = msg;
        showMessages = true;
        isLoadingChat = true;
        
        try {
          const records = await pb.collection('messages').getList(1, 50, {
            sort: 'created',
            filter: `thread_id = "${msg.thread_id}"`,
            expand: 'customer_id'
          });

          chatMessages = records.items.map(formatChatMessage);
        } catch (err) {
          console.error('Error loading chat history:', err);
        } finally {
          isLoadingChat = false;
        }
      }

      // Function to send a new message
      async function sendMessage(event: SubmitEvent) {
        if (!selectedMessage) return;
        
        const form = event.target as HTMLFormElement;
        const input = form.querySelector('input') as HTMLInputElement;
        const message = input.value.trim();
        if (!message) return;

        try {
          const messageData = {
            customer_name: data.user?.name || 'Support Agent',
            message: message,
            thread_id: selectedMessage.thread_id,
            company_id: data.user?.company_id,
            status: 'replied',
            source: 'web',
            created: new Date().toISOString(),
            initials: data.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??',
            color: 'bg-primary'
          };

          await pb.collection('messages').create(messageData);
          input.value = '';
          
          // Immediately load new messages after sending
          await loadMessages();

        } catch (err) {
          console.error('Error sending message:', err);
        }
      }

      // Add this function to load company members
      async function loadCompanyMembers() {
        try {
          const company = await pb.collection('companies').getOne(data.user?.company_id, {
            expand: 'team_members'
          });
          
          if (company.expand?.team_members) {
            companyMembers = company.expand.team_members.map((member: any) => ({
              id: member.id,
              name: member.name
            }));
          }
        } catch (err) {
          console.error('Error loading company members:', err);
        }
      }

      // Add function to assign message
      async function assignMessage(messageId: string, userId: string) {
        try {
          await pb.collection('messages').update(messageId, {
            assigned_to: userId,
            status: 'assigned'
          });
          
          // Reload messages to reflect changes
          await loadMessages();
          toast.success('Message assigned successfully');
        } catch (err) {
          console.error('Error assigning message:', err);
          toast.error('Failed to assign message');
        }
      }

      // Add function for quick self-assignment
      async function assignToMe(messageId: string) {
        await assignMessage(messageId, data.user.id);
      }
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="h1 font-semibold text-2xl">Inbox</div>
    
    <div class="w-full h-[61px] bg-white rounded-lg px-8 flex items-center justify-between">
        <div class="flex items-center gap-14">
            <h3 class="text-xl font-normal leading-8">
                All
            </h3>
            <h3 class="text-xl font-normal leading-8">
                Unassigned
            </h3>
            <h3 class="text-xl font-normal leading-8">
                Me
            </h3>
        </div>
    
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
                    {#if initialLoad && isLoadingMessages}
                        {#each Array(5) as _}
                            <div class="flex items-center gap-4 py-4">
                                <div class="flex-shrink-0">
                                    <div class="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
                                </div>
                                <div class="flex-grow">
                                    <div class="flex items-center justify-between">
                                        <div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                        <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                    </div>
                                    <div class="h-4 bg-gray-200 rounded w-3/4 mt-2 animate-pulse"></div>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        {#each messages as msg}
                            <div 
                              class="flex items-center gap-4 py-4 cursor-pointer hover:bg-gray-50"
                              onclick={() => selectMessage(msg)}
                            >
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
                                    <p class="font-light line-clamp-2">{msg.message}</p>
                                    {#if msg.assigned_to}
                                        <div class="mt-1 text-sm text-gray-500">
                                            Assigned to: {companyMembers.find(m => m.id === msg.assigned_to)?.name || 'Unknown'}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {/if}
                        
                </div>
            </div>
        </div>

        <div class="w-1/2 bg-white rounded-xl flex flex-col">
            <div class="flex-1 overflow-y-auto">
                {#if selectedMessage && showMessages}
                    {#if isLoadingChat}
                        <div class="flex flex-col gap-4 p-4">
                            {#each Array(3) as _}
                                <div class="border border-dashed border-gray-200 rounded-lg p-4">
                                    <div class="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                                    <div class="space-y-3">
                                        <div class="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                        <div class="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                        <div class="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="flex flex-col gap-4 p-4">
                            {#each chatMessages as msg}
                                <div class="border border-dashed border-gray-200 rounded-lg p-4">
                                    <div class="flex items-center gap-2 mb-2">
                                        <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span class="font-medium">Leadform submission</span>
                                    </div>
                                    
                                    <div class="space-y-2 text-sm">
                                        <div class="flex">
                                            <span class="font-medium w-24">Name:</span>
                                            <span>{msg.sender}</span>
                                        </div>
                                        
                                        <div class="flex">
                                            <span class="font-medium w-24">Phone:</span>
                                            <span>{msg.phone || 'N/A'}</span>
                                        </div>
                                        
                                        <div class="flex">
                                            <span class="font-medium w-24">Email:</span>
                                            <span>{msg.email || 'N/A'}</span>
                                        </div>
                                        
                                        <div class="flex">
                                            <span class="font-medium w-24">Message:</span>
                                            <span>{msg.message}</span>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                            <div class="w-full">
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <Button class="bg-primary text-white w-full">
                                    <UserPlus class="w-5 h-5 mr-2" />
                                    {selectedMessage?.assigned_to ? 'Reassign' : 'Assign'}
                                  </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content class="w-56">
                                  <DropdownMenu.Group>
                                    <DropdownMenu.Label>Assign to</DropdownMenu.Label>
                                    <DropdownMenu.Item 
                                      onclick={() => assignToMe(selectedMessage?.id)}
                                    >
                                      Assign to me
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    {#each companyMembers as member}
                                      {#if member.id !== data.user.id}
                                        <DropdownMenu.Item 
                                          onclick={() => assignMessage(selectedMessage?.id, member.id)}
                                        >
                                          {member.name}
                                        </DropdownMenu.Item>
                                      {/if}
                                    {/each}
                                  </DropdownMenu.Group>
                                </DropdownMenu.Content>
                              </DropdownMenu.Root>
                            </div>
                        </div>
                    {/if}
                {:else}
                    <div class="flex-1 flex items-center justify-center h-full">
                        <div class="text-center">
                            <div class="mb-2">
                                <MessageSquareText class="w-16 h-16 mx-auto opacity-50" />
                            </div>
                            <p>No conversation selected.</p>
                        </div>
                    </div>
                {/if}
                
            </div>

            <form 
              class="border-t p-4"
              onsubmit={e => {
                e.preventDefault();
                sendMessage(e);
              }}
            >
                <div class="flex gap-4 mb-4">
                    <button class="text-primary border-b-2 border-primary pb-2">Message</button>
                    <button class="pb-2">Note</button>
                </div>
                <div class="w-full">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      class="flex-1 bg-transparent py-3 focus:outline-none w-full"
                      disabled={!selectedMessage}
                    >
                </div>
                <div class="flex gap-2">
                    <div class="flex items-center gap-2 rounded-lg w-full justify-between">
                        <div class="flex items-center gap-6">
                            <Smile class="h-5 w-5" />
                            <Images class="h-5 w-5" />
                        </div>
                        <Button 
                          type="submit"
                          class="bg-primary hover:bg-blue-700 text-white px-6 text-sm font-semibold"
                          disabled={!selectedMessage}
                        >
                            SEND
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
