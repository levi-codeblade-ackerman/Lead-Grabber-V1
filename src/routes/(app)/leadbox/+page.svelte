<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Switch } from "$lib/components/ui/switch/index";
    import { CodeXml, Edit, MessageSquare, Pen, Phone, Play, PlusCircle } from "lucide-svelte";
    import EditChannelDialog from "$lib/components/EditChannelDialog.svelte";
    import EditSecondaryButtonDialog from "$lib/components/EditSecondaryButtonDialog.svelte";
    import { toast } from 'svelte-sonner';
    import { enhance } from '$app/forms';
	import { getLeadboxEmbedCode } from "$lib/utils/getEmbedCode.js";
    import { pb } from '$lib/pocketbase';
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Copy, Check } from "lucide-svelte";
    import { getSvgIcon } from '$lib/utils/getSvgIcon';
	import { onMount } from "svelte";

    let { data } = $props();
    let user = data.user;

    // Initialize state from saved data or defaults
    let textOnly = $state(data.leadbox?.leadbox_data?.textOnly ?? true);
    let iconOnly = $state(data.leadbox?.leadbox_data?.iconOnly ?? false);
    let leadBoxOpen = $state(data.leadbox?.leadbox_data?.leadBoxOpen ?? true);
    let primaryIconOnly = $state(data.leadbox?.leadbox_data?.primaryIconOnly ?? false);

    // Add logo image state
    let logoImage = $state(data.leadbox?.leadbox_data?.logoImage ?? '/img/gen-can-expo.png');
    let logoImageFile: File | null = $state(null);

    let channels = $state(
        data.leadbox?.leadbox_data?.channels ?? [
            { name: "Text", icon: MessageSquare, value: "Text Us", url: "sms://", target: "_blank", buttonColor: "#40C4AA", showIcon: true },
            { name: "Call", icon: Phone, value: "Request a Call", url: "tel://", target: "_blank", buttonColor: "#3B5BDB", showIcon: true },
            { name: "Watch", icon: Play, value: "Watch a Demo", url: "https://", target: "_blank", buttonColor: "#3B5BDB", showIcon: true },
        ]
    );

    let secondaryButton = $state(
        data.leadbox?.leadbox_data?.secondaryButton ?? {
            text: "Call us now!",
            icon: "MessageSquare",
            showIcon: true
        }
    );

    function handleChannelUpdate(index: number, updatedChannel: any) {
        const iconComponent = updatedChannel.icon;
        channels[index] = {
            ...updatedChannel,
            icon: iconComponent,
            showIcon: updatedChannel.showIcon
        };
        channels = channels; // trigger reactivity
    }

    function handleSecondaryButtonUpdate(data: { text: string, icon: any, showIcon: boolean }) {
        secondaryButton = data;
    }

    // Add image upload handler
    async function handleImageUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        logoImageFile = file;

        try {
            const formData = new FormData();
            formData.append('logo', file);
            formData.append('user', user.id);

            const record = await pb.collection('logos').create(formData);
            logoImage = pb.files.getUrl(record, record.logo);
            toast.success('Logo uploaded successfully!');
        } catch (err) {
            toast.error('Error uploading logo');
            console.error(err);
        }
    }

    let showEmbedDialog = $state(false);
    let copied = $state(false);

    function copyEmbedCode() {
        const embedCode = getLeadboxEmbedCode(data.leadbox?.id ?? '');
        navigator.clipboard.writeText(embedCode);
        copied = true;
        toast.success('Embed code copied to clipboard!');
        setTimeout(() => {
            copied = false;
        }, 2000);
    }

    let iconSvgs = $state({});

    onMount(async () => {
        // Load all needed SVG icons
        const iconNames = ['MessageSquare', 'Phone', 'Play', 'Mail', 'Map', 'Target', 'Clock', 'CreditCard', 'Search'];
        for (const name of iconNames) {
            iconSvgs[name] = await getSvgIcon(name);
        }
    });
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="flex items-center justify-between w-full">
        <div class="h1 font-semibold text-2xl">Leadbox</div>
        <Button 
  variant="outline" 
  class="gap-2 bg-transparent border border-primary text-primary rounded-lg hover:text-white"
  onclick={() => showEmbedDialog = true}
>
  <CodeXml class="h-4 w-4" />
  Get Embed Code
</Button>
    </div>

    <div class="flex gap-5">
        <!-- Left Section -->
        <div class="w-1/2  rounded-xl p-6 bg-white h-fit">
            <div class="bg-white rounded-xl">
            <div class="mb-8 w-full">
                <h2 class="text-xl font-semibold text-primary mb-2 flex items-center gap-2">Channels
                    {#if channels.length < 4 && !textOnly}
                    <Button variant="ghost" class="p-0 hover:bg-transparent">
                        <PlusCircle class="h-6 w-6" />
                    </Button>
                    {/if}
                </h2>
                <p class="text-gray-500 text-sm mb-4">you can select up to 4 channels</p>
                
                <div class="flex items-center gap-4 mb-4">
                    <span class="text-gray-700">Leadbox mode:</span>
                    <span class="text-primary">Text Only</span>
                    <Switch checked={!textOnly} onCheckedChange={(v) => textOnly = !v} />
                    <span>Channels</span>
                </div>

                {#if !textOnly}
                <div class="flex flex-col gap-10">

                {#each channels as channel, i}
                <div class="flex justify-between items-center">
                    <div class="flex gap-7 items-center">
                    <div class="h-9 w-9 bg-dialog rounded-full flex items-center justify-center text-black font-medium">{i+1}</div>
                    <span>{channel.name}</span>
                    <div class="bg-[#D9D9D9] px-4 py-1 rounded-lg">{channel.value}</div>
                    </div>
                    <EditChannelDialog 
                        channel={channel} 
                        onSave={(updatedChannel) => handleChannelUpdate(i, updatedChannel)}
                    >
                        <Button variant="ghost" class="p-0 hover:bg-transparent">
                            <Pen class="h-6 w-6" />
                        </Button>
                    </EditChannelDialog>
                </div>
                
                {/each}
            </div>

                {/if}
            </div>

            <div class="mb-8 w-full">
                <h2 class="text-xl font-semibold text-primary mb-2">Buttons</h2>
                <p class="text-gray-500 text-sm mb-4">Customize the look and content in the contact buttons below the Leadbox</p>
                
                <div class="flex items-center gap-4 mb-4 w-full justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-gray-700">Primary button:</span>
                        <span>With text</span>
                        <Switch checked={primaryIconOnly} onCheckedChange={(v) => primaryIconOnly = v} />
                        <span class="text-primary">Icon only</span>
                    </div>
                    <Button variant="ghost" class="p-0 hover:bg-transparent">
                        <Pen class="h-6 w-6" />
                    </Button>
                </div>

                <div class="flex items-center gap-4 w-full justify-between">
                    <span class="text-gray-700">Secondary button</span>
                    <EditSecondaryButtonDialog
                        buttonText={secondaryButton.text}
                        showIcon={secondaryButton.showIcon}
                        selectedIcon={secondaryButton.icon}
                        onSave={handleSecondaryButtonUpdate}
                    >
                        <Button variant="ghost" class="p-0 hover:bg-transparent">
                            <Pen class="h-6 w-6" />
                        </Button>
                    </EditSecondaryButtonDialog>
                </div>
            </div>

            <div class="mb-8 w-full">
                <h2 class="text-xl font-semibold text-primary mb-2">Logo</h2>
                <p class="text-gray-500 text-sm mb-4">Upload your company logo</p>
                
                <div class="flex items-center gap-4">
                    <img 
                        src={logoImage} 
                        alt="Company Logo" 
                        class="w-[164px] h-[82px] object-contain border rounded p-2"
                    />
                    <label class="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            onclick={(e) => e.stopPropagation()}
                            onchange={handleImageUpload}
                        />
                        <Button 
                            variant="outline" 
                            class="gap-2"
                            onclick={(e) => {
                                e.preventDefault();
                                e.currentTarget.previousElementSibling?.click();
                            }}
                        >
                            <Edit class="h-4 w-4" />
                            Change Logo
                        </Button>
                    </label>
                </div>
            </div>
        </div>
        </div>

        <!-- Right Section - Preview -->
        <div class="w-1/2 bg-white rounded-xl p-6 relative h-[80vh]">
            <h2 class="text-xl font-semibold mb-6">Leadbox Preview</h2>
            
            <div class="absolute  bottom-4 right-4">

            
            {#if leadBoxOpen}
            <div class="border border-gray-200 overflow-hidden relative w-[517px] mx-auto bg-dialog ">
                <div class="bg-[#3B5BDB] text-white p-4 items-center h-28">
                    <p class="text-lg">Text with us.</p>
                  
                </div>
                
                <div class="p-6 flex flex-col gap-6 relative">
                    <div class="flex justify-center mb-4 relative">
                        <img 
                            src={logoImage} 
                            alt="Company Logo" 
                            class="w-[164px] h-[82px] object-contain absolute top-[-40px] z-10"
                        />
                    </div>
                    
                    <div class="space-y-3 mt-12 px-5 bg-white pt-4 pb-20">
                        {#if !textOnly}
                        {#each channels as channel}
                        <Button variant="custom" class="w-full rounded-full text-white py-4 hover:bg-{channel.buttonColor}/90"
                            style={`background-color: ${channel.buttonColor};`}
                        >
                            {#if channel.showIcon}
                                {@html iconSvgs[channel.icon] || ''}
                            {/if}
                            {#if !iconOnly}
                                {channel.value}
                            {/if}
                        </Button>
                        {/each}
                        {/if}
                        {#if textOnly}
                        <div class="flex flex-col gap-2">
                            <label class="text-gray-700" for="name">Name</label>
                            <input type="text" class="border border-gray-200 p-2 border-y-0 border-l-0 border-r-0 rounded-none border-b border-b-black bg-transparent focus:outline-none focus:ring-0" 
                            name="name"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-gray-700" for="mobile">Mobile Number</label>
                            <input type="text" class="border border-gray-200 p-2 border-y-0 border-l-0 border-r-0 rounded-none border-b border-b-black bg-transparent focus:outline-none focus:ring-0" 
                            name="mobile"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-gray-700" for="message">Message</label>
                            <textarea class="border border-gray-200 p-2 border-y-0 border-l-0 border-r-0 rounded-none border-b border-b-black bg-transparent focus:outline-none focus:ring-0" 
                            name="message"
                            ></textarea>
                        </div>
                        {/if}
                    </div>

                    <div class="text-center text-xs text-gray-500">
                        Use subject to terms • Lead&Terms
                    </div>
                </div>
            </div>

            <!-- secondary button -->
            <div class="mt-4 flex justify-end gap-2">
                <Button variant="custom" class="bg-[#3B5BDB] text-white px-6 rounded-md flex items-center gap-2">
                    {secondaryButton.text}
                    {#if secondaryButton.showIcon}
                        {@html iconSvgs[secondaryButton.icon] || ''}
                    {/if}
                </Button>
            </div>
            {/if}

            <div class="mt-7 flex justify-end gap-2 ">
                {#if primaryIconOnly}
                <Button variant="custom" class="bg-[#3B5BDB] h-14 w-14 rounded-full text-white p-2 flex items-center gap-2"
                onclick={() => leadBoxOpen = !leadBoxOpen}
                >
                    <MessageSquare class="h-8 w-8" />
                </Button>
                {:else}
                <div class="flex flex-col items-center relative">
                <div class="h-14 absolute top-[-22px] w-full rounded-3xl z-10 bg-primary flex justify-center ">
                    <p class="text-white text-sm px-4">Questions?, just ask</p>
                </div>
                <Button variant="custom" class="bg-white h-14 px-20 z-20 rounded-full text-primary shadow-md flex items-center justify-center gap-2 text-lg font-medium"
                onclick={() => leadBoxOpen = !leadBoxOpen}
                >
                    TEXT US
                </Button>
                </div>
                {/if}
            </div>
            </div>
        </div>
        <form
            method="POST"
            action="?/saveLeadbox"
            use:enhance={() => {
                return async ({ result }) => {
                    if (result.type === 'success') {
                        toast.success( 'Leadbox saved successfully!');
                    } else {
                        toast.error( 'Error saving leadbox');
                    }
                };
            }}
        >
            <input 
                type="hidden" 
                name="leadboxData" 
                value={JSON.stringify({
                    textOnly,
                    iconOnly,
                    leadBoxOpen,
                    primaryIconOnly,
                    channels,
                    secondaryButton,
                    logoImage
                })} 
            />
            
            <!-- Move the save button inside the form -->
            <div class="flex justify-start mt-4">
                <Button 
                    type="submit"
                    class="bg-primary text-white px-8"
                >
                    Save Changes
                </Button>
            </div>
        </form>
    </div>
</div>

<Dialog.Root bind:open={showEmbedDialog}>
  <Dialog.Content class="sm:max-w-[70rem]">
    <Dialog.Header>
      <Dialog.Title>Embed Code</Dialog.Title>
      <Dialog.Description>
        Copy this code and paste it into your website where you want the leadbox to appear.
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="relative mt-4">
      <pre class="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
        {getLeadboxEmbedCode(data.leadbox?.id ?? '')}
      </pre>
      
      <Button 
        variant="outline" 
        size="icon" 
        class="absolute top-2 right-2"
        onclick={copyEmbedCode}
      >
        {#if copied}
          <Check class="h-4 w-4" />
        {:else}
          <Copy class="h-4 w-4" />
        {/if}
      </Button>
    </div>

    <Dialog.Footer>
      <Dialog.Close>
        <Button variant="outline">Close</Button>
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

