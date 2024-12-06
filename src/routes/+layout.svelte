<script lang="ts">
	import '../app.css';
	let { children, data } = $props();
	import { onMount } from 'svelte';
	import { initPocketBase } from '$lib/pocketbase';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { AuthModel } from 'pocketbase';
	import { Toaster } from "$lib/components/ui/sonner/index";
	import { pb } from '$lib/pocketbase';
	import { onNavigate } from '$app/navigation';
	import LoadingBar from '$lib/components/loading-bar.svelte';
	$effect(() => {
		console.log('data', data);
			console.log('user from layout', data.user);
	});
	const unprotectedRoutes = ['/login', '/signup'];
	
	onMount(() => {
        initPocketBase();
        // authStore.initialize();
    });

	   // Check if route requires auth
	   console.log("event.url.pathname", $page.url.pathname)
    const isProtectedRoute = $page.url.pathname !== '/login' && $page.url.pathname !== '/signup';
    const isAuthRoute = $page.url.pathname === '/login' || $page.url.pathname === '/signup';
    const isSignupRoute = $page.url.pathname === '/signup';
    
	// $effect(() => {
		onNavigate(() => {
		// Handle protected routes
		if (isProtectedRoute && !pb.authStore.isValid) {
        console.log("You are not logged in so redirecting to login")
       goto('/login', { replaceState: true });
			}
		})
	// });

	// $effect(() => {
		// user = $authStore.user;
		console.log("user from layour", data.user)
		console.log("authStore", $authStore)
		
		// Check auth state on every navigation
		// const isAuthRoute = $page.url.pathname.startsWith('/(auth)') || 
		// 				   unprotectedRoutes.includes($page.url.pathname);
		// if (!user && !isAuthRoute) {
		// 	goto('/login', { replaceState: true }); // Replace state prevents back navigation
		// }
		
		// if (user && isAuthRoute) {
		// 	goto('/', { replaceState: true });
		// }
	// });
</script>

<LoadingBar class="bg-primary" />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
</svelte:head>
<Toaster richColors/>
<div class="root-layout overflow-hidden">
	<main>{@render children()}</main>
</div>
