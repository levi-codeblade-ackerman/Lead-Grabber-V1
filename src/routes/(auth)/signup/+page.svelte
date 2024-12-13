<script lang="ts">
    import { enhance } from '$app/forms';
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { toast } from "svelte-sonner";
    import { goto } from '$app/navigation';

    let loading = $state(false);

    function handleEnhance() {
        return async ({ result, update }) => {
            loading = false;
            
            if (result.type === 'failure') {
                toast.error(result.data?.message || 'Failed to create account');
                await update();
                return;
            }
            
            if (result.data?.success) {
                toast.success(result.data.message);
                await goto('/create-company');
            }
        };
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full lg:w-[460px] flex flex-col justify-center">
        <div class="mx-auto">
            <img src="/img/logo.png" alt="ClearSky Software" class="h-[88px] w-[189px]" />
        </div>
        
        <div class="w-full lg:w-[460px] bg-white rounded-lg p-8">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-2xl font-semibold text-gray-900">Sign Up</h2>
            </div>

            <form method="POST" use:enhance={handleEnhance} onsubmit={() => loading = true} class="space-y-6">
                <div>
                    <Input
                        name="name"
                        type="text"
                        placeholder="Full Name"
                        required
                        class="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-primary/60 focus:bg-white focus:ring-0"
                    />
                </div>
                <div>
                    <Input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        class="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-primary/60 focus:bg-white focus:ring-0"
                    />
                </div>
                <div>
                    <Input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        class="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-primary/60 focus:bg-white focus:ring-0"
                    />
                </div>
                <div>
                    <Input
                        name="passwordConfirm"
                        type="password"
                        placeholder="Confirm Password"
                        required
                        class="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-primary/60 focus:bg-white focus:ring-0"
                    />
                </div>

                <Button 
                    type="submit" 
                    class="w-full" 
                    disabled={loading}
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>

                <div class="text-center text-sm">
                    <a href="/login" class="text-primary hover:underline">
                        Already have an account? Log in
                    </a>
                </div>
            </form>
        </div>
    </div>
</div> 