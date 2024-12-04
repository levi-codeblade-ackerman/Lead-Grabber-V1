import { pb } from '$lib/pocketbase';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // load the store data from the request cookie string
    pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

    // Set pb instance in locals
    event.locals.pb = pb;
    event.locals.user = pb.authStore.model;

    try {
        // get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
        if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh();
        }
    } catch (_) {
        // clear the auth store on failed refresh
        pb.authStore.clear();
        event.cookies.delete('pb_auth', { path: '/' });
    }

    // Check if route requires auth
    const isProtectedRoute = event.url.pathname !== '/login' && event.url.pathname !== '/signup';
    const isAuthRoute = event.url.pathname === '/login' || event.url.pathname === '/signup';
    const isSignupRoute = event.url.pathname === '/signup';
    
    // Handle protected routes
    if (isProtectedRoute && !pb.authStore.isValid) {
        throw redirect(303, '/login');
    }
    
    // Handle auth routes (login, register, etc.), but exclude signup
    if (isAuthRoute && !isSignupRoute && pb.authStore.isValid) {
        throw redirect(303, '/');
    }

    const response = await resolve(event);

    // send back the default 'pb_auth' cookie to the client with the latest store state
    response.headers.append('set-cookie', pb.authStore.exportToCookie({ httpOnly: false }));

    return response;
}; 