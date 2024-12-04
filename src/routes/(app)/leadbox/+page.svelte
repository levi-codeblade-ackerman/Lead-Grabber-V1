<script>
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Switch } from "$lib/components/ui/switch/index";
    import { CodeXml, Edit, MessageSquare, Phone, Play } from "lucide-svelte";

    let textOnly = false;
    let iconOnly = false;
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
                    <Switch checked={textOnly} onCheckedChange={(v) => textOnly = v} />
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
        <div class="w-1/2 bg-white rounded-xl p-6">
            <h2 class="text-xl font-semibold mb-6">Leadbox Preview</h2>
            
            <div class="border border-gray-200 overflow-hidden relative w-[517px] mx-auto bg-dialog ">
                <div class="bg-[#3B5BDB] text-white p-4 items-center h-28">
                    <p class="text-lg">Text with us. Enter .</p>
                  
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
                        <Button variant="custom" class="w-full rounded-full bg-[#40C4AA] text-white py-4 hover:bg-[#40C4AA]/90">
                            <MessageSquare class="h-5 w-5" />
                            TEXT US
                        </Button>

                        <Button variant="custom" class="w-full rounded-full bg-[#3B5BDB] text-white py-4 hover:bg-[#3B5BDB]/90">
                            <Phone class="h-5 w-5" />
                            REQUEST A CALL
                        </Button>

                        <Button variant="custom" class="w-full rounded-full bg-[#3B5BDB] text-white py-4 hover:bg-[#3B5BDB]/90">
                            <Play class="h-5 w-5" />
                            WATCH A DEMO NOW
                        </Button>
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
        </div>
    </div>
</div>
