import { fail } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email') as string;
        const password = data.get('password') as string;
        const passwordConfirm = data.get('passwordConfirm') as string;

        if (password !== passwordConfirm) {
            return fail(400, {
                success: false,
                message: 'Passwords do not match'
            });
        }

        try {
            let user = await pb.collection('users').create({
                email,
                emailVisibility: true,
                password,
                passwordConfirm,
                username: email.split('@')[0],
            });

            console.log('user created', user);

            return {
                success: true,
                message: 'Account created successfully'
            };
        } catch (err: any) {
            console.log('err', err);
            return fail(400, {
                success: false,
                message: err.response?.message || 'Failed to create account'
            });
        }
    }
}; 