import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

export const initPocketBase = async () => {
    try {
        // Load auth state from cookies
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('pb_auth='));
            
        if (cookie) {
            const authData = decodeURIComponent(cookie.split('=')[1]);
            pb.authStore.loadFromCookie(`pb_auth=${authData}`);
        }

        if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh();
        }
    } catch (error) {
        console.error('PocketBase init error:', error);
        pb.authStore.clear();
    }
}; 