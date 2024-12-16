<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { toast } from "svelte-sonner";
    import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
    
    let { data } = $props();
    let loading = $state(false);

    function getCompanyLogo(filename: string) {
        if (!filename) return '';
        return `${PUBLIC_POCKETBASE_URL}/api/files/${data.invite.company.collectionId}/${data.invite.company.id}/${filename}`;
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <Card.Root class="w-full max-w-md">
        <Card.Header class="space-y-2">
            {#if data.invite.company.logo}
                <img 
                    src={getCompanyLogo(data.invite.company.logo)} 
                    alt="Company Logo" 
                    class="h-12 w-auto mx-auto"
                />
            {/if}
            <Card.Title class="text-center text-2xl">Team Invitation</Card.Title>
            <Card.Description class="text-center">
                You've been invited to join {data.invite.company.name}
            </Card.Description>
        </Card.Header>
        
        <Card.Content class="space-y-6">
            <div class="text-sm text-gray-500 space-y-2">
                <p>
                    <span class="font-medium text-gray-900">{data.invite.invitedBy.name}</span> has invited you to join their team as a <span class="font-medium text-gray-900">{data.invite.role}</span>.
                </p>
                <p>
                    Accepting this invitation will give you access to {data.invite.company.name}'s workspace.
                </p>
            </div>

            <form
                method="POST"
                action="?/accept"
                use:enhance={() => {
                    loading = true;
                    return async ({ result }) => {
                        if (result.type === 'redirect') {
                            toast.success('Invitation accepted successfully');
                        } else {
                            toast.error('Failed to accept invitation');
                            loading = false;
                        }
                    };
                }}
                class="space-y-4"
            >
                <div class="flex justify-end gap-4">
                    <Button 
                        type="submit" 
                        disabled={loading}
                        class="w-full"
                    >
                        {#if loading}
                            Accepting Invitation...
                        {:else}
                            Accept Invitation
                        {/if}
                    </Button>
                </div>
            </form>
        </Card.Content>
    </Card.Root>
</div> 