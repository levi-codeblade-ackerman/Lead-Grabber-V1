import { fail, redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { NODE_ENV } from '$env/static/private';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        try {
            const authData = await pb.collection('users').authWithPassword(email, password);
            
            if (!authData?.token) {
                throw new Error('No auth token received');
            }

            // Set cookie with proper encoding
            const cookieData = {
                token: authData.token,
                record: authData.record
            };

            cookies.set('pb_auth', JSON.stringify(cookieData), {
                path: '/',
                httpOnly: false,
                secure: NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });

            return {
                success: true,
                message: 'Login successful',
                user: authData.record
            };
        } catch (err: any) {
            console.error('Login error:', err);
            return fail(400, {
                success: false,
                message: err.response?.message || 'Invalid credentials'
            });
        }
    }
}; 