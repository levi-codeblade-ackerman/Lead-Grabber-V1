import { pb } from '$lib/pocketbase';
import { fail } from '@sveltejs/kit';

export const actions = {
  signup: async ({ request }) => {
    try {
      const data = await request.formData();
      const email = data.get('email')?.toString();
      const password = data.get('password')?.toString();

      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }

      // Create new user
      const newUser = await pb.collection('users').create({
        email,
        password,
        emailVisibility: true, // Set email visibility to true
      });

      console.log('New user created:', newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Error during signup:', error);
      return fail(500, { error: 'Failed to sign up' });
    }
  }
}; 