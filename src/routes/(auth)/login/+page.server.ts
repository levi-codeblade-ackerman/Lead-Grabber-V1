import { fail, redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        try {
            const authData = await pb.collection('users').authWithPassword(email, password);
            
            // The cookie will be automatically handled by the hooks.server.ts
            
            return {
                success: true,
                message: 'Login successful'
            };
        } catch (err: any) {
            console.log('err', err);
            return fail(400, {
                success: false,
                message: err.response?.message || 'Invalid credentials'
            });
        }
    }
}; 