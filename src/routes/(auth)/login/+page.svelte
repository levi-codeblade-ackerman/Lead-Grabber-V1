<script lang="ts">
    import { applyAction, enhance } from '$app/forms';
    import { Button } from "$lib/components/ui/button/index";
    import { Input } from "$lib/components/ui/input";
    import { goto } from '$app/navigation';
    import { toast } from 'svelte-sonner';
    import Spinner from "$lib/components/ui/spinner.svelte";
    import { createInstance } from '$lib/pocketbase';
     import { pb } from '$lib/pocketbase'
    
    export let form;
    let loading = false;

    function handleEnhance() {
        return async ({ result }) => {
            if (result.type === 'success') {
                toast.success(result.data.message);
                await goto(result.data.redirectTo);
            } else {
                toast.error(result.data?.message || 'Login failed');
            }
        };
    }
</script>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[1000px] w-full flex gap-6 bg-dialog">
        <div class="flex-1 hidden lg:block">
            <img 
                src="/img/login.png" 
                alt="Person working on laptop" 
                class="w-full h-full object-cover rounded-lg"
                loading="lazy"
            />
        </div>

        <div class="w-full lg:w-[460px] flex flex-col justify-center">
            <div class="mx-auto">
                <img src="/img/logo.png" alt="ClearSky Software" class="h-[88px] w-[189px]" />
            </div>
            
            <div class="w-full lg:w-[460px] bg-white rounded-lg p-8">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-2xl font-semibold text-gray-900">Login</h2>
                </div>

                <form 
                    method="POST" 
                    use:enhance={() => {
                        return async ({ result }) => {
                          pb.authStore.loadFromCookie(document.cookie)
                          await applyAction(result)
                        }
                    }} 
                    onsubmit={() => loading = true} 
                    class="space-y-6"
                >
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

                    {#if form?.error}
                        <p class="text-red-500 text-sm">{form.error}</p>
                    {/if}

                   
                    <Button
                        type="submit"
                        disabled={loading}
                        class="w-full py-3 px-4 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                    >
                        {#if loading}
                            <Spinner />
                            Logging in...
                        {:else}
                            Login
                        {/if}
                    </Button>
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300"></div>
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-white text-gray-500">Or login with</span>
                        </div>
                    </div>
                    <button
                    type="button"
                    class="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center gap-2"
                >
                    Log in with Google
                </button>
                    <p class="text-center text-sm text-gray-600">
                        Don't have an account? 
                        <a href="/signup" class="text-primary hover:underline">Sign up</a>
                    </p>
                </form>
            </div>
        </div>
    </div>
</div>