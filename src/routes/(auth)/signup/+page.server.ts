import { pb } from '$lib/pocketbase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        try {
            const data = await request.formData();
            const email = data.get('email')?.toString();
            const password = data.get('password')?.toString();
            const passwordConfirm = data.get('passwordConfirm')?.toString();
            const name = data.get('name')?.toString();

            if (!email || !password || !passwordConfirm || !name) {
                return fail(400, {
                    success: false,
                    message: 'All fields are required'
                });
            }

            if (password !== passwordConfirm) {
                return fail(400, {
                    success: false,
                    message: 'Passwords do not match'
                });
            }

            // Create user
            const user = await pb.collection('users').create({
                email,
                password,
                passwordConfirm,
                name,
                emailVisibility: true
            });

            // Log the user in
            await pb.collection('users').authWithPassword(email, password);

            // Set the auth cookie
            cookies.set('pb_auth', pb.authStore.exportToCookie(), {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });

            return {
                success: true,
                message: 'Account created successfully'
            };
        } catch (error: any) {
            console.error('Signup error:', error);
            let errorMessage = 'Error creating account';
            
            if (error.response?.data) {
                const data = error.response.data;
                if (data.email) {
                    errorMessage = 'Email is already in use';
                } else if (data.username) {
                    errorMessage = 'Username is already in use';
                } else {
                    errorMessage = Object.values(data).join('; ');
                }
            }
            
            return fail(400, {
                success: false,
                message: errorMessage
            });
        }
    }
}; 