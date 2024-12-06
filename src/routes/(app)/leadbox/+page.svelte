<script>
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Switch } from "$lib/components/ui/switch/index";
    import { CodeXml, Edit, MessageSquare, Phone, Play } from "lucide-svelte";

    let textOnly = true;
    let iconOnly = false;
    let leadBoxOpen = true;

    let channels = [
        { name: "Text", icon: MessageSquare, value: "Text Us", url: "sms://", target: "_blank", buttonColor: "#40C4AA" },
        { name: "Call", icon: Phone, value: "Request a Call", url: "tel://", target: "_blank", buttonColor: "#3B5BDB" },
        { name: "Watch", icon: Play, value: "Watch a Demo", url: "https://", target: "_blank", buttonColor: "#3B5BDB" },
    ]
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="flex items-center justify-between">
        <div class="h1 font-semibold text-2xl">Leadbox</div>
        <Button variant="outline" class="gap-2 bg-transparent border border-primary text-primary rounded-lg hover:text-white">
            <CodeXml class="h-4 w-4" />
            Get Embed Code
        </Button>
    </div>

    <div class="flex gap-5">
        <!-- Left Section -->
        <div class="w-1/2  rounded-xl p-6 bg-white h-fit">
            <div class="bg-white rounded-xl">
            <div class="mb-8">
                <h2 class="text-xl font-semibold text-primary mb-2">Channels</h2>
                <p class="text-gray-500 text-sm mb-4">you can select up to 4 channels</p>
                
                <div class="flex items-center gap-4 mb-4">
                    <span class="text-gray-700">Leadbox mode:</span>
                    <span class="text-primary">Text Only</span>
                    <Switch checked={!textOnly} onCheckedChange={(v) => textOnly = !v} />
                    <span>Channels</span>
                </div>
            </div>

            <div class="mb-8">
                <h2 class="text-xl font-semibold text-primary mb-2">Buttons</h2>
                <p class="text-gray-500 text-sm mb-4">Customize the look and content in the contact buttons below the Leadbox</p>
                
                <div class="flex items-center gap-4 mb-4">
                    <span class="text-gray-700">Primary button:</span>
                    <span>With text</span>
                    <Switch checked={iconOnly} onCheckedChange={(v) => iconOnly = v} />
                    <span class="text-primary">Icon only</span>
                </div>

                <div class="flex items-center gap-4">
                    <span class="text-gray-700">Primary button:</span>
                    <input 
                        type="text" 
                        class="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter button text..."
                    />
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
                            src="/img/gen-can-expo.png" 
                            alt="Gen Can Expo" 
                            class="w-[164px] h-[82px] object-contain absolute top-[-40px] z-10"
                        />
                    </div>
                    
                    <div class="space-y-3 mt-12 px-5 bg-white pt-4 pb-20">
                        {#if !textOnly}
                        {#each channels as channel}
                        <Button variant="custom" class="w-full rounded-full {channel.buttonColor} text-white py-4 hover:bg-{channel.buttonColor}/90"
                        style={`background-color: ${channel.buttonColor}; `}
                        >
                            <channel.icon class="h-5 w-5" />
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

            <div class="mt-4 flex justify-end gap-2">
                <Button variant="custom" class="bg-[#3B5BDB] text-white px-6 rounded-md flex items-center gap-2">
                    Call us now!
                    <MessageSquare class="h-4 w-4" />
                </Button>
            </div>
            {/if}

            <div class="mt-4 flex justify-end gap-2 ">
                <Button variant="custom" class="bg-[#3B5BDB] h-14 w-14 rounded-full text-white p-2 flex items-center gap-2"
                onclick={() => leadBoxOpen = !leadBoxOpen}
                >
                    <MessageSquare class="h-8 w-8" />
                </Button>
                </div>
            </div>
        </div>
    </div>
</div>
