<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { Switch } from "$lib/components/ui/switch/index";
    import * as Tabs from "$lib/components/ui/tabs/index";
    import { toast } from 'svelte-sonner';
    import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
    import { Loader2, Users } from 'lucide-svelte';
    import { onDestroy } from 'svelte';
    import * as Dialog from "$lib/components/ui/dialog/index";
    import * as Select from "$lib/components/ui/select/index.js";

    let { data } = $props();
    let company = data.company;
    let form: any;
    let loading = $state(false);
    let previewUrl: string | null = $state(null);
    let showInviteDialog = $state(false);

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

    async function updateMemberRole(memberId: string, newRole: string) {
        try {
            await pb.collection('users').update(memberId, {
                role: newRole
            });
            toast.success('Member role updated');
        } catch (error) {
            toast.error('Failed to update member role');
            console.error('Error updating role:', error);
        }
    }
</script>

<div class="h-[90vh] flex flex-col gap-3 p-4 bg-gray-100">
    <div class="flex items-center justify-between">
        <div class="h1 font-semibold text-2xl">Company Settings</div>
    </div>

    <div class="bg-white rounded-xl p-6 w-full flex-1 overflow-hidden">
        <Tabs.Root value="customization" class="h-full flex flex-col">
            <div class="flex gap-4 mb-6 items-center">
                <h2 class="text-xl font-semibold text-primary">Company Profile</h2>
                <div class="flex gap-4 text-gray-500">
                    <Tabs.List>
                        <Tabs.Trigger value="customization">
                            Customization
                        </Tabs.Trigger>
                        <Tabs.Trigger value="members">
                            Team Members
                        </Tabs.Trigger>
                    </Tabs.List>
                </div>
            </div>

            <p class="text-gray-500 mb-8">Manage your company profile and team members</p>

            <Tabs.Content value="customization" class="flex-1 overflow-y-auto">
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
                    <div class="space-y-4 ">
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
                                    class="w-20 p-1"
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

                    <div class="flex justify-start">
                        <Button type="submit" class="bg-primary text-white px-8" disabled={loading}>
                            {#if loading}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                                Saving Changes...
                            {:else}
                                Save Changes
                            {/if}
                        </Button>
                    </div>
                </form>
            </Tabs.Content>

            <Tabs.Content value="members" class="flex-1 overflow-y-auto">
                <div class="space-y-6">
                    <div class="flex justify-end items-center">
                        <Button 
                            variant="outline" 
                            class="gap-2"
                            onclick={() => showInviteDialog = true}
                        >
                            <Users class="h-4 w-4" />
                            Invite Member
                        </Button>
                    </div>

                    <div class="divide-y">
                        {#each company.members || [] as member}
                            <div class="flex items-center justify-between py-4">
                                <div class="flex items-center gap-4">
                                    <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        {member.name?.[0]?.toUpperCase() || '??'}
                                    </div>
                                    <div>
                                        <div class="font-medium">{member.name}</div>
                                        <div class="text-sm text-muted-foreground">{member.email}</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <Select.Root 
                                        type="single" 
                                        value={member.role}
                                        onValueChange={(value) => updateMemberRole(member.id, value)}
                                        disabled={member.id === company.owner}
                                    >
                                        <Select.Trigger class="w-32">
                                            <Select.Value />
                                        </Select.Trigger>
                                        <Select.Content>
                                            <Select.Item value="owner">Owner</Select.Item>
                                            <Select.Item value="admin">Admin</Select.Item>
                                            <Select.Item value="member">Member</Select.Item>
                                        </Select.Content>
                                    </Select.Root>
                                    
                                    {#if member.id !== company.owner}
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onclick={() => removeMember(member.id)}
                                        >
                                            Remove
                                        </Button>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </Tabs.Content>
        </Tabs.Root>
    </div>
</div>

<Dialog.Root bind:open={showInviteDialog} >
    <Dialog.Content class="max-w-xl">
        <Dialog.Header>
            <Dialog.Title>Invite Team Member</Dialog.Title>
            <Dialog.Description>
                Send an invitation to join your team
            </Dialog.Description>
        </Dialog.Header>

        <form 
            method="POST" 
            action="?/inviteMember"
            use:enhance={() => {
                return async ({ result }) => {
                    if (result.type === 'success') {
                        toast.success('Invitation sent successfully');
                        showInviteDialog = false;
                    } else {
                        toast.error(result.data?.error || 'Failed to send invitation');
                    }
                };
            }}
            class="space-y-4"
        >
            <div class="space-y-2">
                <Label for="email">Email Address</Label>
                <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="colleague@example.com"
                />
            </div>

            <div class="space-y-2">
                <Label for="role">Role</Label>
                <Select.Root type="single" >
                    <Select.Trigger class="w-full"> </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="admin">Admin</Select.Item>
                        <Select.Item value="member">Member</Select.Item>
                    </Select.Content>
                </Select.Root>
            </div>

            <div class="flex justify-end gap-2">
                <Button type="button" variant="ghost" onclick={() => showInviteDialog = false}>
                    Cancel
                </Button>
                <Button type="submit">
                    Send Invitation
                </Button>
            </div>
        </form>
    </Dialog.Content>
</Dialog.Root> 