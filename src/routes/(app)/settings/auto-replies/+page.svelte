<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import { Switch } from "$lib/components/ui/switch/index";
    import { Edit, Clock } from "lucide-svelte";
    import { toast } from 'svelte-sonner';
    import { enhance } from '$app/forms';

    let { data } = $props();
    
    // Initialize state from saved data or defaults
    let textAutoReply = $state(data?.autoReply?.textAutoReply ?? false);
    let businessHoursMessage = $state(data?.autoReply?.businessHoursMessage ?? 'Thanks for contacting Canadian Trade-Ex. Our team will respond shortly.');
    let afterHoursMessage = $state(data?.autoReply?.afterHoursMessage ?? 'Thanks for contacting us. Canadian Trade-Ex is closed at the moment, but we\'ll get back to you during open hours starting at 8:00 AM Monday.');
    let leadformBusinessHoursMessage = $state(data?.autoReply?.leadformBusinessHoursMessage ?? 'Thanks for contacting Canadian Trade-Ex. Our team will respond shortly.');
    let leadformAfterHoursMessage = $state(data?.autoReply?.leadformAfterHoursMessage ?? 'Thanks for contacting us. Canadian Trade-Ex is closed at the moment, but we\'ll get back to you during open hours starting at 8:00 AM Monday.');
    
    let businessHours = $state({
        sunday: { isOpen: false, hours: null, showTimePicker: false, startHour: 8, startPeriod: 'AM', endHour: 6, endPeriod: 'PM' },
        monday: { isOpen: true, hours: '8:00 AM - 6:00 PM', showTimePicker: false, startHour: 8, startPeriod: 'AM', endHour: 6, endPeriod: 'PM' },
        tuesday: { isOpen: true, hours: '8:00 AM - 6:00 PM', showTimePicker: false, startHour: 8, startPeriod: 'AM', endHour: 6, endPeriod: 'PM' },
        wednesday: { isOpen: true, hours: '8:00 AM - 6:00 PM', showTimePicker: false, startHour: 8, startPeriod: 'AM', endHour: 6, endPeriod: 'PM' },
        thursday: { isOpen: true, hours: '8:00 AM - 6:00 PM', showTimePicker: false, startHour: 8, startPeriod: 'AM', endHour: 6, endPeriod: 'PM' },
        friday: { isOpen: true, hours: '8:00 AM - 6:00 PM', showTimePicker: false, startHour: 8, startPeriod: 'AM', endHour: 6, endPeriod: 'PM' },
        saturday: { isOpen: true, hours: null, showTimePicker: false, startHour: 8, startPeriod: 'AM', endHour: 6, endPeriod: 'PM' }
    });
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="h1 font-semibold text-2xl">Auto Replies</div>

    <div class="flex gap-5 flex-1 overflow-hidden">
        <!-- Left Section -->
        <div class="w-1/2 rounded-xl p-6 bg-white overflow-y-auto">
            <div class="mb-8">
                <h2 class="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
                    Text Auto Reply
                </h2>
                <p class="text-gray-500 text-sm mb-4">Schedule and edit auto replies</p>
                
                <div class="flex items-center gap-4 mb-6">
                    <span class="text-gray-700">Auto Reply:</span>
                    <span>Off</span>
                    <Switch checked={textAutoReply} onCheckedChange={(v) => textAutoReply = v} />
                    <span class="text-primary">On</span>
                </div>

               
            </div>

            <div>
                <h2 class="text-xl font-semibold text-primary mb-4">Set your business hours</h2>
                <div class="space-y-4">
                    {#each Object.entries(businessHours) as [day, settings]}
                        <div class="flex items-center gap-4">
                            <span class="w-24 capitalize">{day}:</span>
                            <Button 
                                variant="outline" 
                                class={`w-24 ${settings.isOpen ? 'text-primary' : ''}`}
                                onclick={() => settings.isOpen = !settings.isOpen}
                                disabled={!textAutoReply}
                            >
                                {settings.isOpen ? 'Open' : 'Closed'}
                            </Button>
                            {#if settings.isOpen}
                                <div class="flex items-center gap-2 relative">
                                    {#if settings.hours}
                                        <span class="text-sm text-gray-600">{settings.hours}</span>
                                    {/if}
                                    <Button 
                                        variant="ghost" 
                                        class="p-1 hover:bg-transparent"
                                        onclick={() => settings.showTimePicker = !settings.showTimePicker}
                                        disabled={!textAutoReply}
                                    >
                                        <Clock class="h-4 w-4" />
                                    </Button>
                                    
                                    {#if settings.showTimePicker}
                                        <div class="absolute top-full mt-2 bg-white border rounded-lg shadow-lg p-4 z-10">
                                            <div class="flex gap-4">
                                                <!-- Start Time -->
                                                <div>
                                                    <label class="text-sm font-medium mb-2">Start Time</label>
                                                    <select 
                                                        class="border rounded p-1 text-sm"
                                                        bind:value={settings.startHour}
                                                    >
                                                        {#each Array.from({ length: 12 }, (_, i) => i + 1) as hour}
                                                            <option value={hour}>{hour}</option>
                                                        {/each}
                                                    </select>
                                                    <select 
                                                        class="border rounded p-1 text-sm ml-1"
                                                        bind:value={settings.startPeriod}
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                                
                                                <!-- End Time -->
                                                <div>
                                                    <label class="text-sm font-medium mb-2">End Time</label>
                                                    <select 
                                                        class="border rounded p-1 text-sm"
                                                        bind:value={settings.endHour}
                                                    >
                                                        {#each Array.from({ length: 12 }, (_, i) => i + 1) as hour}
                                                            <option value={hour}>{hour}</option>
                                                        {/each}
                                                    </select>
                                                    <select 
                                                        class="border rounded p-1 text-sm ml-1"
                                                        bind:value={settings.endPeriod}
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                class="mt-4 w-full"
                                                onclick={() => {
                                                    settings.hours = `${settings.startHour}:00 ${settings.startPeriod} - ${settings.endHour}:00 ${settings.endPeriod}`;
                                                    settings.showTimePicker = false;
                                                }}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <form
                method="POST"
                action="?/saveAutoReply"
                use:enhance={() => {
                    return async ({ result }) => {
                        if (result.type === 'success') {
                            toast.success('Auto reply settings saved successfully!');
                        } else {
                            toast.error('Error saving auto reply settings');
                        }
                    };
                }}
            >
                <input 
                    type="hidden" 
                    name="autoReplyData" 
                    value={JSON.stringify({
                        textAutoReply,
                        businessHoursMessage,
                        afterHoursMessage,
                        leadformBusinessHoursMessage,
                        leadformAfterHoursMessage,
                        businessHours
                    })} 
                />
                
                <div class="flex justify-start mt-8">
                    <Button 
                        type="submit"
                        class="bg-primary text-white px-8"
                        disabled={!textAutoReply}
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>

        <!-- Right Section - Preview -->
        <div class="w-1/2 bg-white rounded-xl p-6 overflow-y-auto">
            <h2 class="text-xl font-semibold text-primary mb-6">Leadbox</h2>
            
            <div class="space-y-6">
                <div class="border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm text-gray-600">Business hours auto reply message</h3>
                        <Button 
                            variant="ghost" 
                            class="p-1 hover:bg-transparent"
                            onclick={() => {/* Add edit functionality */}}
                            disabled={!textAutoReply}
                        >
                            <Edit class="h-4 w-4" />
                        </Button>
                    </div>
                    <textarea
                        class="w-full p-2 text-gray-700 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500"
                        rows="2"
                        bind:value={businessHoursMessage}
                        disabled={!textAutoReply}
                    />
                </div>

                <div class="border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm text-gray-600">After hours auto reply message</h3>
                        <Button 
                            variant="ghost" 
                            class="p-1 hover:bg-transparent"
                            onclick={() => {/* Add edit functionality */}}
                            disabled={!textAutoReply}
                        >
                            <Edit class="h-4 w-4" />
                        </Button>
                    </div>
                    <textarea
                        class="w-full p-2 text-gray-700 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500"
                        rows="3"
                        bind:value={afterHoursMessage}
                        disabled={!textAutoReply}
                    />
                </div>
            </div>

            <h2 class="text-xl font-semibold text-primary mb-6 mt-8">Leadform</h2>
            
            <div class="space-y-6">
                <div class="border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm text-gray-600">Business hours auto reply message</h3>
                        <Button 
                            variant="ghost" 
                            class="p-1 hover:bg-transparent"
                            onclick={() => {/* Add edit functionality */}}
                            disabled={!textAutoReply}
                        >
                            <Edit class="h-4 w-4" />
                        </Button>
                    </div>
                    <textarea
                        class="w-full p-2 text-gray-700 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500"
                        rows="2"
                        bind:value={businessHoursMessage}
                        disabled={!textAutoReply}
                    />
                </div>

                <div class="border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm text-gray-600">After hours auto reply message</h3>
                        <Button 
                            variant="ghost" 
                            class="p-1 hover:bg-transparent"
                            onclick={() => {/* Add edit functionality */}}
                            disabled={!textAutoReply}
                        >
                            <Edit class="h-4 w-4" />
                        </Button>
                    </div>
                    <textarea
                        class="w-full p-2 text-gray-700 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500"
                        rows="3"
                        bind:value={afterHoursMessage}
                        disabled={!textAutoReply}
                    />
                </div>
            </div>
        </div>
    </div>
</div> 