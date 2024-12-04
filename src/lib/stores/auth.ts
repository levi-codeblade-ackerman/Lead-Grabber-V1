import { writable } from 'svelte/store';
import { pb } from '$lib/pocketbase';
import type { AuthModel } from 'pocketbase';

interface AuthStore {
    user: AuthModel | null;
    token: string | null;
}
    
function createAuthStore() {
    const { subscribe, set } = writable<AuthStore>({
        user: pb.authStore.model,
        token: pb.authStore.token
    });

    pb.authStore.onChange((token, model) => {
        set({ user: model, token });
    });

    return {
        subscribe,
        setUser: (user: AuthModel | null) => {
            set({ user, token: pb.authStore.token });
        },
        logout: () => {
            pb.authStore.clear();
            set({ user: null, token: null });
        }
    };
}

export const authStore = createAuthStore(); 