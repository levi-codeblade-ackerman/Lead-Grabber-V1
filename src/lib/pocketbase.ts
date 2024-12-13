import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { goto } from '$app/navigation';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Add helper to check token expiry
export function isTokenNearExpiry(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // Return true if token expires in less than 5 minutes
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch {
    return false;
  }
}

export const initPocketBase = async () => {
    try {
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('pb_auth='));
            
        if (cookie) {
            const authData = decodeURIComponent(cookie.split('=')[1]);
            pb.authStore.loadFromCookie(`pb_auth=${authData}`);
            
            // Only refresh if token exists but is near expiry
            if (pb.authStore.isValid && isTokenNearExpiry(pb.authStore.token)) {
                try {
                    await pb.collection('users').authRefresh();
                } catch (err) {
                    pb.authStore.clear();
                    throw err;
                }
            }
        }
    } catch (error) {
        console.error('PocketBase init error:', error);
        pb.authStore.clear();
        goto('/login');
    }
}; 