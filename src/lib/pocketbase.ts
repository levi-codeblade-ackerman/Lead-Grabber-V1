import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Auto-refresh token on app load
export const initPocketBase = () => {
    if (pb.authStore.isValid) {
        try {
            pb.collection('users').authRefresh();
        } catch (_) {
            pb.authStore.clear();
        }
    }
}; 