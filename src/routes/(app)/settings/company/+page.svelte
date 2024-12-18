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
    import { onDestroy, onMount } from 'svelte';
    import * as Dialog from "$lib/components/ui/dialog/index";
    import * as Select from "$lib/components/ui/select/index.js";
    import { pb } from '$lib/pocketbase';
    import RoleBadge from '$lib/components/RoleBadge.svelte';
    import { formatDate } from '$lib/utils/date';

    interface CompanyMember {
        id: string;
        name: string;
        email: string;
        role: string;
    }

    interface Company {
        id: string;
        collectionId: string;
        name: string;
        website?: string;
        logo?: string;
        owner: string;
        members: CompanyMember[];
        settings: {
            branding: {
                primary_color: string;
            };
            notifications: {
                email: boolean;
                web: boolean;
            };
        };
    }

    interface Member {
        id: string;
        user: {
            id: string;
            name: string;
            email: string;
            avatar?: string;
        };
        role: 'owner' | 'admin' | 'member';
        joined_at: string;
    }

    let { data } = $props<{ 
        data: { 
            company: Company;
            members: Member[];
        }
    }>();
    let company = data.company;
    let form: any;
    let loading = $state(false);
    let previewUrl: string | null = $state(null);
    let showInviteDialog = $state(false);
    let pendingInvites = $state<{
        id: string;
        email: string;
        role: string;
        status: string;
        created: string;
        resent?: string;
    }[]>([]);
    let editMemberDialog = $state(false);
    let selectedMember = $state<Member | null>(null);
    let selectedRole = $state<string>('');
    let selectedInviteRole = $state('member');

    // Define roles
    const roles = [
        { value: "admin", label: "Admin" },
        { value: "member", label: "Member" }
    ];

    // Derived store for trigger content
    const roleTriggerContent = $derived(
        roles.find((role) => role.value === selectedRole)?.label ?? "Select a role"
    );

    // Add this new derived store for invite role trigger content
    const inviteRoleTriggerContent = $derived(
        roles.find((role) => role.value === selectedInviteRole)?.label ?? "Select a role"
    );

    // Derived store for edit member role trigger content
    const editRoleTriggerContent = $derived(
        roles.find((role) => role.value === selectedRole)?.label ?? "Select a role"
    );

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

    async function loadPendingInvites() {
        try {
            const records = await pb.collection('invites').getList(1, 50, {
                filter: `company_id = "${company.id}"`,
                sort: '-created'
            });
            pendingInvites = records.items;
        } catch (err) {
            console.error('Error loading invites:', err);
            toast.error('Failed to load invites');
        }
    }

    onMount(() => {
        loadPendingInvites();
    });

    async function cancelInvite(inviteId: string) {
        try {
            await pb.collection('invites').delete(inviteId);
            toast.success('Invite cancelled');
            await loadPendingInvites();
        } catch (err) {
            console.error('Error cancelling invite:', err);
            toast.error('Failed to cancel invite');
        }
    }

    async function removeMember(memberId: string) {
        try {
            await pb.collection('users').update(memberId, {
                company_id: null,
                role: null
            });
            toast.success('Member removed successfully');
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
        }
    }

    async function resendInvite(inviteId: string) {
        try {
            await pb.collection('invites').update(inviteId, {
                resent: new Date().toISOString()
            });
            toast.success('Invitation resent successfully');
        } catch (error) {
            console.error('Error resending invite:', error);
            toast.error('Failed to resend invitation');
        }
    }

    async function checkUserExists(email: string) {
        try {
            const user = await pb.collection('users').getFirstListItem(`email="${email}"`);
            return user !== null;
        } catch {
            return false;
        }
    }

    async function handleInviteMember(email: string, role: string) {
        const userExists = await checkUserExists(email);
        if (!userExists) {
            toast.error('This email is not registered. Please ask them to create an account first.');
            return;
        }

        try {
            await pb.collection('invites').create({
                email,
                company_id: company.id,
                role,
                status: 'pending',
                invited_by: user.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
            toast.success('Invitation sent successfully');
            showInviteDialog = false;
            await loadPendingInvites();
        } catch (error) {
            console.error('Error sending invite:', error);
            toast.error('Failed to send invitation');
        }
    }

    async function handleEditMember(member: Member) {
        selectedMember = member;
        selectedRole = member.role;
        editMemberDialog = true;
    }

    async function handleRoleUpdate() {
        if (!selectedMember || !selectedRole) return;

        try {
            await pb.collection('company_members').update(selectedMember.id, {
                role: selectedRole
            });
            toast.success('Member role updated');
            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Error updating member:', error);
            toast.error('Failed to update member');
        } finally {
            editMemberDialog = false;
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
                            if (result.type === 'success') {
                                toast.success('Company settings updated successfully');
                            } else if (result.type === 'failure') {
                                toast.error(result.data?.error || 'Failed to update company');
                            } else if (result.type === 'error') {
                                toast.error(result.error || 'An error occurred');
                            }
                            loading = false;
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

                    <div class="space-y-4">
                        <h3 class="text-lg font-medium">Active Members</h3>
                        <div class="bg-white rounded-lg shadow">
                            <div class="p-6">
                                <h2 class="text-lg font-semibold mb-4">Active Members</h2>
                                
                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Member
                                                </th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            {#each data.members as member}
                                                <tr>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <div class="h-10 w-10 flex-shrink-0">
                                                                {#if member.user?.avatar}
                                                                    <img 
                                                                        class="h-10 w-10 rounded-full" 
                                                                        src={member.user.avatar} 
                                                                        alt="" 
                                                                    />
                                                                {:else}
                                                                    <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                        <span class="text-gray-500 font-medium">
                                                                            {member.user?.name?.charAt(0).toUpperCase() ?? '?'}
                                                                        </span>
                                                                    </div>
                                                                {/if}
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="text-sm font-medium text-gray-900">
                                                                    {member.user?.name ?? 'Unknown'}
                                                                </div>
                                                                <div class="text-sm text-gray-500">
                                                                    {member.user?.email ?? 'No email'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <RoleBadge role={member.role} />
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(member.joined_at)}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button 
                                                            class="text-indigo-600 hover:text-indigo-900"
                                                            onclick={() => handleEditMember(member)}
                                                        >
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {#if pendingInvites.length > 0}
                        <div class="space-y-4">
                            <h3 class="text-lg font-medium">Invitations</h3>
                            <div class="space-y-2">
                                {#each pendingInvites as invite}
                                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p class="font-medium">{invite.email}</p>
                                            <div class="flex gap-2 items-center">
                                                <p class="text-sm text-gray-500">Role: {invite.role}</p>
                                                <span class="text-sm px-2 py-0.5 rounded-full {
                                                    invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }">
                                                    {invite.status}
                                                </span>
                                            </div>
                                        </div>
                                        {#if invite.status === 'pending'}
                                            <div class="flex items-center gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onclick={() => cancelInvite(invite.id)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onclick={() => resendInvite(invite.id)}
                                                >
                                                    Resend
                                                </Button>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </Tabs.Content>
        </Tabs.Root>
    </div>
</div>

<Dialog.Root bind:open={showInviteDialog} >
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Invite Team Member</Dialog.Title>
            <Dialog.Description>
                Invite a new member to join your team
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
                        await loadPendingInvites();
                    } else if (result.type === 'failure') {
                        toast.error(result.data?.error || 'Failed to send invitation');
                    }
                };
            }}
        >
            <div class="grid gap-4 py-4">
                <div class="space-y-2">
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="member@company.com"
                        required
                    />
                </div>
                <div class="space-y-2">
                    <Label>Role</Label>
                    <Select.Root 
                        type="single" 
                        name="role" 
                        bind:value={selectedInviteRole}
                    >
                        <Select.Trigger class="w-full">
                            {inviteRoleTriggerContent}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.GroupHeading>Available Roles</Select.GroupHeading>
                                {#each roles as role}
                                    <Select.Item 
                                        value={role.value} 
                                        label={role.label}
                                    >
                                        {role.label}
                                    </Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
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

<Dialog.Root bind:open={editMemberDialog}>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Edit Member Role</Dialog.Title>
            <Dialog.Description>
                Change the role for {selectedMember?.user?.name}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <div class="space-y-2">
                <Label>Role</Label>
                <Select.Root type="single" bind:value={selectedRole}>
                    <Select.Trigger class="w-full">
                        {editRoleTriggerContent}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Group>
                            {#each roles as role}
                                {#if selectedMember?.role === 'owner' || role.value !== 'owner'}
                                    <Select.Item value={role.value} label={role.label}>
                                        {role.label}
                                    </Select.Item>
                                {/if}
                            {/each}
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
            </div>
        </div>

        <Dialog.Footer>
            <Button 
                variant="outline" 
                onclick={() => editMemberDialog = false}
            >
                Cancel
            </Button>
            <Button 
                onclick={handleRoleUpdate}
                disabled={!selectedRole || selectedRole === selectedMember?.role}
            >
                Save Changes
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root> 