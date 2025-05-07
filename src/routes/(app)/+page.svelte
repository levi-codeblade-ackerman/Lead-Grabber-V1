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
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";
	import { getUserContext } from "@//contexts/user.js";
	import type { Message } from "$lib/types/message";

  const contextUser = getUserContext()
  console.log('contextUser', $contextUser)
        if ($contextUser == null) {
            goto('/login');
        }
  let { data } = $props();
	let { user } = data;
      console.log('data', data);
      if(user === null){
        goto('/login');
      }
      if(user !== null && user?.company_id === null || user?.company_id === ""){
        goto('/create-company');
      }
     
      
      // Add message data store
      let messages = $state<Message[]>([]);
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
        timestamp: string;
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

      let selectedTab = $state('all');
      let filteredMessages = $state<typeof messages>([]);

      // Replace the existing filteredMessages with memoized version
      $effect(() => {
        const filterFn = (msg: any) => {
          switch (selectedTab) {
            case 'unassigned':
              return !msg.assigned_to;
            case 'me':
              return msg.assigned_to === user?.id;
            default:
              return true;
          }
        };
        
        filteredMessages = messages.filter(filterFn);
      });

      // Add pagination state
      let page = $state(1);
      const PER_PAGE = 20;

      onMount(async () => {
       
        try {
          // Initial load of messages
          await loadMessages();
          await loadCompanyMembers();
          
          // Increase polling interval to 15 seconds
          pollInterval = setInterval(async () => {
            const latestMessage = messages[0];
            if (latestMessage) {
              // Use $data to access reactive props inside the interval
              const newRecords = await pb.collection('messages').getList(1, 5, {
                sort: '-created',
                filter: `company_id = "${user?.company_id}" && created > "${latestMessage.created}"`,
                expand: 'customer_id'
              });
              
              if (newRecords.items.length > 0) {
                messages = [...newRecords.items.map(formatMessage), ...messages];
              }
            }
          }, 15000);

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
        if (initialLoad) {
          isLoadingMessages = true;
        }
        
        try {
          const records = await pb.collection('messages').getList(page, PER_PAGE, {
            sort: '-created',
            filter: `company_id = "${user?.company_id}"`,
            expand: 'customer_id'
          });

          // Append messages instead of replacing if not initial load
          messages = initialLoad ? 
            records.items.map(formatMessage) : 
            [...messages, ...records.items.map(formatMessage)];

          // Update chat messages only if needed
          if (selectedMessage && initialLoad) {
            isLoadingChat = true;
            await loadChatMessages(selectedMessage.thread_id);
          }

        } catch (err) {
          console.error('Error loading messages:', err);
        } finally {
          isLoadingMessages = false;
          initialLoad = false;
        }
      }

      // Separate chat messages loading
      async function loadChatMessages(threadId: string) {
        try {
          const thread = await pb.collection('messages').getFirstListItem(`thread_id="${threadId}"`);
          
          if (!thread.messages || thread.messages.length === 0) {
            console.error('No messages found in thread');
            chatMessages = [];
            return;
          }

          chatMessages = thread.messages.map((msg: any) => ({
            sender: msg.is_agent_reply ? msg.agent_name || 'Agent' : thread.customer_name,
            message: msg.content,
            phone: thread.customer_phone,  // Only show contact info for first message
            email: thread.customer_email,  // Only show contact info for first message
            time: new Date(msg.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isYou: msg.is_agent_reply,
            timestamp: msg.timestamp
          })).sort(sortByTimestamp);

        } catch (err) {
          console.error('Error loading chat messages:', err);
          chatMessages = [];
        } finally {
          isLoadingChat = false;
        }
      }

      // Helper function to format message consistently
      function formatMessage(msg: any): Message & { name: string; message: string; time: string; } {
        const lastMessage = msg.messages[msg.messages.length - 1];
        const initials = msg.customer_name?.split(' ').map((n: string) => n[0]).join('') || '??';
        const name = msg.customer_name || 'Unknown';
        const messageText = lastMessage?.content || '';
        const time = new Date(lastMessage?.timestamp || msg.created).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const color = msg.color || 'bg-primary';
        
        return {
          id: msg.id,
          thread_id: msg.thread_id,
          customer_name: msg.customer_name,
          customer_phone: msg.customer_phone,
          customer_email: msg.customer_email,
          company_id: msg.company_id || '',
          messages: msg.messages || [],
          status: msg.status || 'new',
          created: msg.created,
          updated: msg.updated || msg.created,
          assigned_to: msg.assigned_to,
          initials,
          color,
          // Additional properties for UI display
          name,
          message: messageText,
          time
        };
      }

      // Update the sort function to use proper types
      function sortByTimestamp(a: { timestamp: string }, b: { timestamp: string }): number {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }

      // Function to select a message and load its chat history
      async function selectMessage(msg: { thread_id: string; [key: string]: any }) {
        selectedMessage = msg;
        showMessages = true;
        isLoadingChat = true;
        
        try {
          await loadChatMessages(msg.thread_id);
        } catch (err) {
          console.error('Error loading chat history:', err);
          chatMessages = [];
        } finally {
          isLoadingChat = false;
        }
      }

      // Function to send a new message
      async function sendMessage(e: Event) {
        e.preventDefault(); // Prevent form submission
        const form = e.target as HTMLFormElement;
        const input = form.querySelector('input') as HTMLInputElement;
        const message = input.value.trim();

        if (!message || !selectedMessage) return;

        // Clear input immediately
        input.value = '';

        try {
          const existingThread = await pb.collection('messages').getFirstListItem(`thread_id="${selectedMessage.thread_id}"`);
          
          // Update the thread with the new message
          const updatedThread = await pb.collection('messages').update(existingThread.id, {
            messages: [...existingThread.messages, {
              content: message,
              timestamp: new Date().toISOString(),
              is_agent_reply: true,
              agent_id: user.id,
              agent_name: user.name
            }],
            status: 'replied'
          });

          // Send via Telnyx if there's a phone number
          if (existingThread.customer_phone) {
            try {
              console.log('Sending SMS to:', existingThread.customer_phone);
              const telnyxResponse = await fetch('/api/telnyx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message,
                  phoneNumber: existingThread.customer_phone,
                  threadId: existingThread.thread_id
                })
              });

              const telnyxResult = await telnyxResponse.json();
              if (!telnyxResult.success) {
                console.error('Failed to send SMS:', telnyxResult.error);
                toast.error('Failed to send SMS');
              } else {
                console.log('SMS sent successfully');
              }
            } catch (telnyxError) {
              console.error('Error sending SMS:', telnyxError);
              toast.error('Failed to send SMS');
            }
          }
          
          // Update the messages list with the new thread
          messages = messages.map(msg => 
            msg.thread_id === updatedThread.thread_id ? formatMessage(updatedThread) : msg
          );
          
          // Update chat messages
          await loadChatMessages(selectedMessage.thread_id);

        } catch (err) {
          console.error('Error sending message:', err);
          toast.error('Failed to send message');
        }
      }

      // Add this function to load company members
      async function loadCompanyMembers() {
        try {
          if (!user?.company_id) {
            console.log('No company ID available');
            return;
          }

          const company = await pb.collection('companies').getOne(user.company_id, {
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
        if (!messageId) return;
        
        try {
            await pb.collection('messages').update(messageId, {
                assigned_to: user.id
            });

            // Update the local messages array by modifying the specific message
            messages = messages.map(msg => 
                msg.id === messageId 
                    ? { ...msg, assigned_to: user.id }
                    : msg
            );

            toast.success('Message assigned to you');
        } catch (err) {
            console.error('Error assigning message:', err);
            toast.error('Failed to assign message');
        }
      }

      // Add function for assigning message to a member
      async function assignToMember(messageId: string, memberId: string) {
        if (!messageId || !memberId) return;
        
        try {
            await pb.collection('messages').update(messageId, {
                assigned_to: memberId
            });

            // Update the local messages array by modifying the specific message
            messages = messages.map(msg => 
                msg.id === messageId 
                    ? { ...msg, assigned_to: memberId }
                    : msg
            );

            toast.success('Message assigned successfully');
        } catch (err) {
            console.error('Error assigning message:', err);
            toast.error('Failed to assign message');
        }
      }

      // Add infinite scroll
      let messagesContainer: HTMLElement;
      function handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        if (
          target.scrollHeight - target.scrollTop === target.clientHeight && 
          !isLoadingMessages
        ) {
          page++;
          loadMessages();
        }
      }
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="h1 font-semibold text-2xl">Inbox</div>
    
    <div class="w-full h-[61px] bg-white rounded-lg px-8 flex items-center justify-between">
        <div class="flex items-center gap-14">
            <button 
                class="text-xl font-normal leading-8 {selectedTab === 'all' ? 'text-primary font-medium' : 'text-gray-600 hover:text-gray-900'}"
                onclick={() => selectedTab = 'all'}
            >
                All
            </button>
            <button 
                class="text-xl font-normal leading-8 {selectedTab === 'unassigned' ? 'text-primary font-medium' : 'text-gray-600 hover:text-gray-900'}"
                onclick={() => selectedTab = 'unassigned'}
            >
                Unassigned
            </button>
            <button 
                class="text-xl font-normal leading-8 {selectedTab === 'me' ? 'text-primary font-medium' : 'text-gray-600 hover:text-gray-900'}"
                onclick={() => selectedTab = 'me'}
            >
                Me
            </button>
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
                        {#each filteredMessages as msg}
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
                                        <h4 class="text-lg font-medium">{(msg as any).name}</h4>
                                        <span class="font-medium">{(msg as any).time}</span>
                                    </div>
                                    <p class="font-light line-clamp-2">{(msg as any).message}</p>
                                    {#if msg.assigned_to}
                                        <div class="mt-1 text-sm text-gray-500">
                                            Assigned to: {companyMembers.find(m => m.id === msg.assigned_to)?.name || 'Unknown'}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                        
                        {#if filteredMessages.length === 0}
                            <div class="py-8 text-center text-gray-500">
                                {#if selectedTab === 'unassigned'}
                                    No unassigned messages
                                {:else if selectedTab === 'me'}
                                    No messages assigned to you
                                {:else}
                                    No messages found
                                {/if}
                            </div>
                        {/if}
                    {/if}
                        
                </div>
            </div>
        </div>

        <div class="w-1/2 bg-white rounded-xl flex flex-col">
            <div 
              class="flex-1 overflow-y-auto" 
              bind:this={messagesContainer}
              onscroll={handleScroll}
            >
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
                        <div class="flex-1 overflow-y-auto p-4 space-y-4">
                            {#if isLoadingChat}
                                <div class="flex justify-center">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            {:else}
                                {#each chatMessages as message, i}
                                    {#if i === 0}
                                        <!-- Initial message with all details -->
                                        <div class="bg-gray-50 rounded-lg p-4 mb-6">
                                            <h3 class="text-sm font-medium mb-2">Initial Message</h3>
                                            <div class="space-y-2 text-sm">
                                                <div><span class="text-gray-500">From:</span> {message.sender}</div>
                                                {#if message.phone}<div><span class="text-gray-500">Phone:</span> {message.phone}</div>{/if}
                                                {#if message.email}<div><span class="text-gray-500">Email:</span> {message.email}</div>{/if}
                                                <div class="mt-3 p-3 bg-white rounded">
                                                    <span class="text-gray-500">Message:</span>
                                                    <div class="mt-1">{message.message}</div>
                                                </div>
                                                <div class="text-xs text-gray-500 mt-2">{message.time}</div>
                                            </div>
                                        </div>
                                    {:else}
                                        <!-- Regular chat message -->
                                        <div class="flex {message.isYou ? 'justify-end' : 'justify-start'}">
                                            <div class="max-w-[70%] {message.isYou ? 'bg-primary text-white' : 'bg-gray-100'} rounded-lg p-3">
                                                <div class="text-xs {message.isYou ? 'text-blue-100' : 'text-gray-500'} mb-1">{message.sender}</div>
                                                <div class="text-sm">{message.message}</div>
                                                <div class="text-xs {message.isYou ? 'text-blue-100' : 'text-gray-500'} mt-1">
                                                    {message.time}
                                                </div>
                                            </div>
                                        </div>
                                    {/if}
                                {/each}
                            {/if}
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
