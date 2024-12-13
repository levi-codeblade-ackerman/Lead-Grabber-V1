<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { Switch } from "$lib/components/ui/switch/index";
    import { toast } from 'svelte-sonner';
    import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
    import { Loader2 } from 'lucide-svelte';
	import { onDestroy } from 'svelte';

    let { data } = $props();
    let company = data.company;
    let form: any;
    let loading = $state(false);
    let previewUrl: string | null = $state(null);

    $effect(() => {
        if (form?.success) {
            toast.success('Company settings updated successfully');
            loading = false;
        }
    });

    function getLogoUrl(filename: string) {
        if (!filename) return '';
        return `${PUBLIC_POCKETBASE_URL}/api/files/${company.collectionId}/${company.id}/${filename}`;
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (file) {
            // Clear previous preview
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            
            // Create new preview
            previewUrl = URL.createObjectURL(file);
        } else {
            previewUrl = null;
        }
    }

    onDestroy(() => {
        // Clean up preview URL when component is destroyed
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    });
</script>

<div class="container max-w-2xl py-8">
    <Card.Root class="p-6">
        <Card.Header>
            <Card.Title>Company Settings</Card.Title>
            <Card.Description>
                Manage your company profile and preferences
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form 
                method="POST" 
                action="?/updateCompany" 
                use:enhance={() => {
                    loading = true;
                    return async ({ result }) => {
                        form = result;
                        if (result.type === 'failure') {
                            toast.error(result.data?.error || 'Failed to update company');
                            loading = false;
                        }
                    };
                }}
                class="space-y-6"
                enctype="multipart/form-data"
            >
                <div class="space-y-4">
                    <div class="space-y-2">
                        <Label for="name">Company Name</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            value={company.name} 
                            required
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="website">Website</Label>
                        <Input 
                            id="website" 
                            name="website" 
                            value={company.website || ''} 
                            type="url"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="primaryColor">Brand Color</Label>
                        <div class="flex gap-2">
                            <Input 
                                id="primaryColor" 
                                name="primaryColor" 
                                value={company.settings.branding.primary_color} 
                                type="color"
                            />
                            <Input 
                                value={company.settings.branding.primary_color}
                                readonly
                            />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label for="logo">Company Logo</Label>
                        <div class="space-y-4">
                            {#if previewUrl || company.logo}
                                <div class="w-32 h-32 relative rounded-lg overflow-hidden border">
                                    <img 
                                        src={previewUrl || getLogoUrl(company.logo)} 
                                        alt="Company Logo" 
                                        class="w-full h-full object-contain"
                                    />
                                </div>
                            {/if}
                            <input 
                                id="logo" 
                                name="logo" 
                                type="file"
                                accept="image/*"
                                onchange={handleFileSelect}
                                class="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary file:text-white
                                    file:hover:bg-primary/90"
                            />
                        </div>
                    </div>

                    <div class="space-y-4 pt-4">
                        <h3 class="text-lg font-medium">Notifications</h3>
                        
                        <div class="flex items-center justify-between">
                            <div class="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <div class="text-sm text-muted-foreground">
                                    Receive email notifications for new leads
                                </div>
                            </div>
                            <Switch 
                                name="emailNotifications"
                                value="true"
                                checked={company.settings.notifications.email}
                            />
                        </div>

                        <div class="flex items-center justify-between">
                            <div class="space-y-0.5">
                                <Label>Web Notifications</Label>
                                <div class="text-sm text-muted-foreground">
                                    Receive browser notifications for new leads
                                </div>
                            </div>
                            <Switch 
                                name="webNotifications"
                                value="true"
                                checked={company.settings.notifications.web}
                            />
                        </div>
                    </div>
                </div>

                <Button type="submit" class="w-full" disabled={loading}>
                    {#if loading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                    {:else}
                        Save Changes
                    {/if}
                </Button>
            </form>
        </Card.Content>
    </Card.Root>
</div> 