<script lang="ts">
    import { applyAction, enhance } from '$app/forms';
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { toast } from "svelte-sonner";
    import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase';
    import { useForm, HintGroup, Hint, validators, email, required, pattern } from 'svelte-use-form';
    import { slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    let loading = $state(false);
    const formValidation = useForm();

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    function handleEnhance() {
        return async ({ result, update }) => {
            loading = false;
            
            if (result.type === 'failure') {
                toast.error(result.data?.message || 'Failed to create account');
                await update();
                return;
            }
            
            if (result.type === 'redirect') {
                pb.authStore.loadFromCookie(document.cookie);
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

            <form method="POST" 
            use:formValidation
            use:enhance={() => {
                if (!$formValidation.valid) {
                    toast.error('Please fill in all required fields correctly');
                    return;
                }
                loading = true;
                return handleEnhance();
            }}
            class="space-y-6">
                <div>
                    <input
                        name="name"
                        type="text"
                        placeholder="Full Name"
                        required
                        use:validators={[required]}
                        class="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-primary/60 focus:bg-white focus:ring-0"
                    />
                    <HintGroup for="name">
                        <div transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }}>
                            <Hint on="required" class="text-red-500 text-sm mt-1">Full name is required</Hint>
                        </div>
                    </HintGroup>
                </div>
                <div>
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        use:validators={[required, email]}
                        class="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-primary/60 focus:bg-white focus:ring-0"
                    />
                    <HintGroup for="email">
                        <div transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }}>
                            <Hint on="required" class="text-red-500 text-sm mt-1">Email is required</Hint>
                            <Hint on="email" hideWhenRequired class="text-red-500 text-sm mt-1">Email is not valid</Hint>
                        </div>
                    </HintGroup>
                </div>
                <div>
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        use:validators={[required, pattern(passwordPattern)]}
                        class="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:border-primary/60 focus:bg-white focus:ring-0"
                    />
                    <HintGroup for="password">
                        <div transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'y' }}>
                            <Hint on="required" class="text-red-500 text-sm mt-1">Password is required</Hint>
                            <Hint on="pattern" hideWhenRequired class="text-red-500 text-sm mt-1">
                                Password must be at least 8 characters and contain at least one letter and one number
                            </Hint>
                        </div>
                    </HintGroup>
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
                    disabled={loading || !$formValidation.valid}
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