<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { toast } from "svelte-sonner";
    import { goto } from '$app/navigation';
    import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
    
    let { data } = $props<{
        data: {
            invite: {
                id: string;
                email: string;
                role: string;
                company: {
                    name: string;
                    logo?: string;
                };
                invitedBy: {
                    name: string;
                };
            };
            requiresLogin?: boolean;
            wrongEmail?: boolean;
            currentUserEmail?: string;
        };
    }>();
    
    let loading = $state(false);

    function handleAccept() {
        return async ({ result }) => {
            loading = false;
            
            if (result.type === 'success') {
                toast.success('Invitation accepted successfully');
                goto('/'); // Redirect to dashboard
            } else {
                toast.error(result.data?.error || 'Failed to accept invitation');
            }
        };
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <Card.Title>Team Invitation</Card.Title>
            <Card.Description>
                You've been invited to join {data.invite.company.name}
            </Card.Description>
        </Card.Header>
        
        <Card.Content class="space-y-4">
            <div class="text-center">
                {#if data.invite.company.logo}
                    <img 
                        src={`${PUBLIC_POCKETBASE_URL}/api/files/${data.invite.company.collectionId}/${data.invite.company.id}/${data.invite.company.logo}`}
                        alt="Company Logo"
                        class="mx-auto h-16 w-auto"
                    />
                {/if}
                <p class="mt-4 text-sm text-gray-600">
                    {data.invite.invitedBy.name} has invited you to join their team as a {data.invite.role}.
                </p>
            </div>

            {#if data.requiresLogin}
                <div class="text-center space-y-4">
                    <p class="text-sm text-gray-600">
                        Please log in with <span class="font-medium">{data.invite.email}</span> to accept this invitation.
                    </p>
                    <Button 
                        onclick={() => goto(`/login?redirect=/invite/accept/${data.invite.id}`)}
                        class="w-full"
                    >
                        Log in to Accept
                    </Button>
                </div>
            {:else if data.wrongEmail}
                <div class="text-center space-y-4">
                    <p class="text-sm text-red-600">
                        You are currently logged in as <span class="font-medium">{data.currentUserEmail}</span>.<br>
                        This invitation is for <span class="font-medium">{data.invite.email}</span>.
                    </p>
                    <div class="space-y-2">
                        <Button 
                            onclick={() => goto('/logout?redirect=/invite/accept/' + data.invite.id)}
                            variant="outline"
                            class="w-full"
                        >
                            Log in with Different Account
                        </Button>
                    </div>
                </div>
            {:else}
                <form 
                    method="POST" 
                    use:enhance={handleAccept}
                    class="space-y-4"
                >
                    <Button 
                        type="submit" 
                        class="w-full" 
                        disabled={loading}
                    >
                        {loading ? 'Accepting...' : 'Accept Invitation'}
                    </Button>
                </form>
            {/if}
        </Card.Content>
    </Card.Root>
</div> 