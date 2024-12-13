import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { goto } from '$app/navigation';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

export const initPocketBase = async () => {
    // Clear any existing auth state
    pb.authStore.clear();
    
    try {
        // Load auth state from cookies
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('pb_auth='));
            
        if (cookie) {
            const authData = decodeURIComponent(cookie.split('=')[1]);
            pb.authStore.loadFromCookie(`pb_auth=${authData}`);
            
            // Verify the token is still valid
            if (pb.authStore.isValid) {
                try {
                    await pb.collection('users').authRefresh();
                } catch (err) {
                    pb.authStore.clear();
                    throw err;
                }
            } else {
                pb.authStore.clear();
            }
        }
    } catch (error) {
        console.error('PocketBase init error:', error);
        pb.authStore.clear();
        goto('/login');
    }
}; 