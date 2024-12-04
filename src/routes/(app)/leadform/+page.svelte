<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import { CodeXml } from "lucide-svelte";
    import { MessageSquare, Phone, Mail, Type, MapPin, List, ChevronDown } from "lucide-svelte";
    import * as Tabs from "$lib/components/ui/tabs/index";
	import { derived } from "svelte/store";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { dndzone } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';
    import type { DndEvent } from 'svelte-dnd-action';
    import type { FormElement } from '$lib/stores/formElements';
	import DraggableFormElement from "$lib/components/DraggableFormElement.svelte";

    let formData = $state<{
        name: {
            value: string,
            required: boolean
        },
        phone: {
            value: string,
            required: boolean
        },
        email: {
            value: string,
            required: boolean
        },
        message: {
            value: string,
            required: boolean
        }
    }>({
        name: {
            value: "",
            required: true
        },
        phone: {
            value: "",
            required: true
        },
        email: {
            value: "",
            required: true
        },
        message: {
            value: "",
            required: true
        }
    });

   $effect(() => {
    console.log(`
    formData:{
        name: ${JSON.stringify(formData.name)},
        phone: ${JSON.stringify(formData.phone)},
        email: ${JSON.stringify(formData.email)},
        message: ${JSON.stringify(formData.message)}
    }
    `)
   })

    let settings = $state<{
        heading: string,
        intro: string,
        buttonText: string,
        buttonColor: string,
        customConfirmation: {
            type: 'default' | 'custom',
            link: string
        },
        privacyPolicy: {
            type: 'default' | 'custom',
            link: string
        },
        customLink: string
    }>({
        heading: "Contact Us",
        intro: "We're here to help! Please connect with us.",
        buttonText: "Submit",
        buttonColor: "#2E53D9",
        customConfirmation: {
            type: 'default',
            link: ''
        },
        privacyPolicy: {
            type: 'default',
            link: ''
        },
        customLink: ""
    });

    let showPreview = $state(false);

    let formElements = $state<FormElement[]>([
        {
            id: 'name',
            type: 'text',
            label: 'Name',
            value: '',
            required: true,
            isDefault: true
        },
        {
            id: 'phone',
            type: 'phone', 
            label: 'Phone',
            value: '',
            required: true,
            isDefault: true
        },
        // Add other default fields
    ]);

    function handleDndConsider(e: CustomEvent<DndEvent<FormElement>>) {
    // Check if we're dragging a new element from the sidebar
    const draggedItem = e.detail.items.find(item => !formElements.find(el => el.id === item.id));
    if (draggedItem) {
        // If it's a new element, add it to the list
        formElements = e.detail.items;
    } else {
        // Otherwise just reorder existing elements
        formElements = e.detail.items;
    }
}

function handleDndFinalize(e: CustomEvent<DndEvent<FormElement>>) {
    formElements = e.detail.items;
}

    const formElementTypes = [
        {
            id: 'text',
            label: 'Text (single line)',
            icon: Type
        },
        {
            id: 'phone',
            label: 'Phone',
            icon: Phone
        },
        {
            id: 'email',
            label: 'Email',
            icon: Mail
        },
        {
            id: 'message',
            label: 'Message',
            icon: MessageSquare
        },
        {
            id: 'address',
            label: 'Address',
            icon: MapPin
        },
        {
            id: 'multiselect',
            label: 'Multi-Select',
            icon: List
        },
        {
            id: 'dropdown',
            label: 'Dropdown',
            icon: ChevronDown
        }
    ];
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="flex items-center justify-between">
        <div class="h1 font-semibold text-2xl">Leadform</div>
        <div class="flex gap-2">
            <Button 
                variant="ghost" 
                class="gap-2 bg-transparent hover:bg-transparent text-primary hover:text-primary/80"
                onclick={() => showPreview = true}
            >
                Preview form
            </Button>
            <Button variant="outline" class="gap-2 bg-transparent border border-primary text-primary rounded-lg hover:text-white">
                <CodeXml class="h-4 w-4" />
                Get Embed Code
            </Button>
        </div>
    </div>

    <div class="bg-white rounded-xl p-6 w-full">
      
        <Tabs.Root value="editor" >
            <div class="flex gap-4 mb-6 items-center">
                <h2 class="text-xl font-semibold text-primary">Contact Form</h2>
                <div class="flex gap-4 text-gray-500">
                    <Tabs.List>
                        <Tabs.Trigger value="editor">
                    <button class="">Form Editor</button>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="settings">
                    <button>Settings</button>
                        </Tabs.Trigger>
                      </Tabs.List>
                </div>
            </div>
    
            <p class="text-gray-500 mb-8">Use the builder are below to construct the Leadform</p>
           
            <Tabs.Content value="editor">
                <div class="flex gap-4">
                    <!-- Form Editor -->
                    <div class="flex-1">
                        <div class="space-y-6 w-full"
                             use:dndzone={{items: formElements, flipDurationMs: 300}}
                             onconsider={handleDndConsider}
                             onfinalize={handleDndFinalize}>
                            {#each formElements as element (element.id)}
                                <div animate:flip={{duration: 300}}>
                                    <DraggableFormElement 
                                    {element}
                                    onDelete={(id) => {
                                        formElements = formElements.filter(e => e.id !== id);
                                    }}
                                    onUpdate={(id, updates) => {
                                        formElements = formElements.map(el => 
                                            el.id === id ? { ...el, ...updates } : el
                                        );
                                    }}
                                />
                                </div>
                            {/each}
                        </div>
                    </div>
                    
                    <!-- Form Elements Sidebar -->
                    <div class="w-64 bg-white p-4 rounded-xl">
                        <h3 class="text-lg font-semibold mb-4">Form Elements</h3>
                        <div class="space-y-2">
                            {#each formElementTypes as type}
                                <div
                                    class="w-full p-2 border rounded hover:bg-gray-50 flex items-center gap-2 cursor-move"
                                    draggable="true"
                                    ondragstart={(e) => {
                                        // Create the new element data
                                        const newElement = {
                                            id: crypto.randomUUID(),
                                            type: type.id,
                                            label: type.label,
                                            value: '',
                                            required: false,
                                            isDefault: false
                                        };
                                        // Add the new element to the items array at the position where it was dragged
                                        const dragIndex = e.detail?.index ?? formElements.length;
                                        const newItems = [...formElements];
                                        newItems.splice(dragIndex, 0, newElement);
                                        formElements = newItems;
                                    }}
                                >
                                    <svelte:component this={type.icon} class="w-4 h-4" />
                                    {type.label}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </Tabs.Content>
            <Tabs.Content value="settings" class="space-y-6">
                <div class="flex items-center gap-4 w-full">
   <!-- Heading Section -->
   <div class="space-y-2 w-1/2">
    <Label for="heading">Heading</Label>
    <Input id="heading" bind:value={settings.heading} placeholder="Contact Us" />
</div>

<!-- Intro Section -->
<div class="space-y-2 w-1/2">
    <Label for="intro">Intro</Label>
    <Input id="intro" bind:value={settings.intro} placeholder="We're here to help! Please connect with us." />
</div>
  </div>
             
  <div class="flex items-center gap-4 w-full">

                <!-- Button Settings -->
                <div class="flex gap-4 w-full">
                    <div class="flex-1 space-y-2 w-1/2">
                        <Label for="buttonText">Button Text</Label>
                        <Input id="buttonText" bind:value={settings.buttonText} placeholder="Submit" />
                    </div>
                    <div class="space-y-2 w-1/2">
                        <Label for="buttonColor">Button Color</Label>
                        <div class="flex gap-2">
                            <Input 
                                id="buttonColor" 
                                bind:value={settings.buttonColor} 
                                placeholder="#2E53D9"
                                class="w-24"
                            />
                            <input 
                                type="color" 
                                bind:value={settings.buttonColor}
                                class="w-10 h-10 p-1 rounded border"
                            />
                        </div>
                    </div>
                </div>
            </div>

                <!-- Confirmation Settings -->
                <div class="space-y-2">
                    <Label>Confirmation</Label>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2 ">
                            <label for="customConfirmation">Default</label>
                            <Switch 
                                id="customConfirmation"
                                checked={settings.customConfirmation.type === 'custom'}
                                onCheckedChange={(checked) => {
                                    settings.customConfirmation.type = checked ? 'custom' : 'default';
                                }}
                            />
                            <label for="customConfirmation">Custom page</label>
                        </div>
                    </div>
                    
                    {#if settings.customConfirmation.type === 'custom'}
                        <div class="mt-2">
                            <Input 
                                bind:value={settings.customConfirmation.link} 
                                placeholder="Enter custom confirmation page URL"
                            />
                        </div>
                    {/if}
                </div>

                <!-- Privacy Policy Settings -->
                <div class="space-y-2">
                    <Label>Privacy Policy Link</Label>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <label for="customPrivacy">Default</label>
                            <Switch 
                                id="customPrivacy"
                                checked={settings.privacyPolicy.type === 'custom'}
                                onCheckedChange={(checked) => {
                                    settings.privacyPolicy.type = checked ? 'custom' : 'default';
                                }}
                            />
                            <label for="customPrivacy">Custom</label>
                        </div>
                    </div>
                    
                    {#if settings.privacyPolicy.type === 'custom'}
                        <div class="mt-2">
                            <Input 
                                bind:value={settings.privacyPolicy.link} 
                                placeholder="Enter custom privacy policy URL"
                            />
                        </div>
                    {/if}
                </div>
            </Tabs.Content>
          </Tabs.Root>
     
    </div>

    <div class="flex justify-start mt-4">

  

        <Button class="bg-primary text-white px-8">Save Changes</Button>
    </div>
</div>

<Dialog.Root bind:open={showPreview}>
    <Dialog.Content class="max-w-2xl">
        <Dialog.Header>
            <Dialog.Title>Form Preview</Dialog.Title>
            <Dialog.Description>
                This is how your form will appear to users
            </Dialog.Description>
        </Dialog.Header>

        <div class="p-6 space-y-6 bg-gray-50 rounded-lg">
            <h2 class="text-2xl font-semibold">{settings.heading}</h2>
            <p class="text-gray-600">{settings.intro}</p>

            <form class="space-y-4">
                {#each formElements as element}
                    <div>
                        {#if element.type === 'text' || element.type === 'phone' || element.type === 'email'}
                            <Input 
                                type={element.type === 'email' ? 'email' : 'text'}
                                placeholder={element.label}
                                class="h-12 bg-white border-gray-200"
                                required={element.required}
                            />
                        {:else if element.type === 'message'}
                            <textarea 
                                placeholder={element.label}
                                class="w-full h-24 p-3 bg-white border border-gray-200 rounded-md"
                                required={element.required}
                            ></textarea>
                        {:else if element.type === 'address'}
                            <textarea 
                                placeholder={element.label}
                                class="w-full h-20 p-3 bg-white border border-gray-200 rounded-md"
                                required={element.required}
                            ></textarea>
                        {:else if element.type === 'multiselect'}
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">{element.label}</label>
                                {#each element.options || [] as option}
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" class="rounded border-gray-300">
                                        <span>{option}</span>
                                    </label>
                                {/each}
                            </div>
                        {:else if element.type === 'dropdown'}
                            <select 
                                class="w-full h-12 px-3 bg-white border border-gray-200 rounded-md"
                                required={element.required}
                            >
                                <option value="">{element.label}</option>
                                {#each element.options || [] as option}
                                    <option value={option}>{option}</option>
                                {/each}
                            </select>
                        {/if}
                    </div>
                {/each}

                <Button 
                    type="submit" 
                    class="w-full"
                    style="background-color: {settings.buttonColor}"
                >
                    {settings.buttonText}
                </Button>
            </form>
        </div>

        <Dialog.Footer>
            <Dialog.Close>
                <Button variant="outline">Close Preview</Button>
            </Dialog.Close>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<style>
    :global(.dialog-overlay) {
        background-color: rgba(255, 255, 255, 0.9) !important;
    }
    
    :global(.dialog-content) {
        border: 1px solid #e5e7eb !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    }
</style>

