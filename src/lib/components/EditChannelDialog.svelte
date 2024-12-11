<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import { getSvgIcon } from "$lib/utils/getSvgIcon";
    import { onMount } from "svelte";

    let { channel, onSave } = $props<{
        channel: {
            name: string;
            icon: any;
            value: string;
            url: string;
            target: string;
            buttonColor: string;
            showIcon?: boolean;
        };
        onSave: (channel: any) => void;
    }>();

    let isOpen = $state(false);
    let editedChannel = $state({ ...channel, showIcon: channel.showIcon ?? true });
    let showIcon = $state(editedChannel.showIcon);

    const icons = [
        { icon: 'Phone', name: "Phone" },
        { icon: 'MessageSquare', name: "Message" },
        { icon: 'Play', name: "Play" },
        { icon: 'Mail', name: "Mail" },
        { icon: 'Map', name: "Map" },
        { icon: 'Target', name: "Target" },
        { icon: 'Clock', name: "Clock" },
        { icon: 'Calendar', name: "Calendar" },
        { icon: 'CreditCard', name: "Card" },
        { icon: 'Search', name: "Search" }
    ];

    let iconSvgs = $state({});

    onMount(async () => {
        for (const { icon } of icons) {
            iconSvgs[icon] = await getSvgIcon(icon);
        }
    });

    function isCurrentIcon(iconName: string) {
        return editedChannel.icon === iconName;
    }

    function handleSave() {
        const updatedChannel = {
            ...editedChannel,
            showIcon: showIcon
        };
        onSave(updatedChannel);
        isOpen = false;
    }

    function selectIcon(iconName: string) {
        editedChannel = {
            ...editedChannel,
            icon: iconName
        };
    }
</script>

<Dialog.Root bind:open={isOpen}>
    <Dialog.Trigger>
        <slot />
    </Dialog.Trigger>
    <Dialog.Content class="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
        <Dialog.Header>
            <Dialog.Title class="text-2xl font-semibold text-center">Edit Channel</Dialog.Title>
            <Dialog.Description class="text-center text-gray-500">
                Customize your channel settings below.
            </Dialog.Description>
        </Dialog.Header>
        <div class="space-y-4">
            <div>
                <Label for="name" class="block text-sm font-medium text-gray-700">Channel type:</Label>
                <Input id="name" bind:value={editedChannel.name} class="mt-1 block w-full" />
            </div>
            
            <div>
                <Label for="value" class="block text-sm font-medium text-gray-700">Button text:</Label>
                <Input id="value" bind:value={editedChannel.value} class="mt-1 block w-full" />
            </div>
            
            <div>
                <Label for="url" class="block text-sm font-medium text-gray-700">URL:</Label>
                <Input id="url" bind:value={editedChannel.url} class="mt-1 block w-full" />
            </div>
            
            <div>
                <Label for="color" class="block text-sm font-medium text-gray-700">Button color:</Label>
                <div class="flex items-center mt-1">
                    <input 
                        type="color" 
                        id="color"
                        bind:value={editedChannel.buttonColor}
                        class="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input 
                        value={editedChannel.buttonColor.toUpperCase()} 
                        class="ml-2 uppercase w-full"
                        readonly
                    />
                </div>
            </div>

            <div class="flex items-center">
                <Label class="text-sm font-medium text-gray-700">Show Icon:</Label>
                <Switch 
                    checked={showIcon}
                    onCheckedChange={(v) => showIcon = v}
                    class="ml-2"
                />
            </div>

            {#if showIcon}
            <div>
                <Label class="block text-sm font-medium text-gray-700">Select Icon:</Label>
                <div class="grid grid-cols-5 gap-2 mt-2">
                    {#each icons as {icon, name}}
                        <button
                            type="button"
                            class="p-2 rounded-md border flex items-center justify-center hover:bg-gray-100 transition-colors data-[state=selected]:bg-primary data-[state=selected]:text-white [&>svg]:stroke-black data-[state=selected]:[&>svg]:stroke-white"
                            data-state={isCurrentIcon(icon) ? 'selected' : 'default'}
                            onclick={() => selectIcon(icon)}
                            aria-label={`Select ${name} icon`}
                        >
                            {@html iconSvgs[icon] || ''}
                        </button>
                    {/each}
                </div>
            </div>
            {/if}
        </div>
        <Dialog.Footer class="flex justify-end space-x-2 mt-4">
            <Button onclick={() => isOpen = false} variant="outline">Cancel</Button>
            <Button onclick={handleSave}>Save changes</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root> 