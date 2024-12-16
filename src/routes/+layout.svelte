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

	const publicRoutes = ['/login', '/signup', '/embed/leadbox'];
	let initialized = $state(false);

	onMount(async () => {
		await initPocketBase();
		if (data.user) {
			authStore.setUser(data.user);
		}
		initialized = true;
	});

	$effect(() => {
		if (!initialized) return;

		const isPublicRoute = publicRoutes.some(
			route => $page.url.pathname.startsWith(route)
		);
		
		const isAuthenticated = pb.authStore.isValid && pb.authStore.token;
		
		// Redirect to login if accessing protected route while not authenticated
		if (!isPublicRoute && !isAuthenticated) {
			goto('/login', { replaceState: true });
		}
		// Redirect to home if accessing login while authenticated
		else if (isAuthenticated && $page.url.pathname.startsWith('/login')) {
			goto('/', { replaceState: true });
		}
	});
</script>

<LoadingBar class="bg-primary" />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
</svelte:head>
<Toaster richColors/>
<div class="root-layout overflow-hidden">
	{@render children()}
</div>
