import { pb } from '$lib/pocketbase';
import { fail } from '@sveltejs/kit';

export const actions = {
  login: async ({ request }) => {
    try {
      const data = await request.formData();
      const email = data.get('email')?.toString();
      const password = data.get('password')?.toString();

      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }

      // Authenticate user
      const user = await pb.collection('users').authWithPassword(email, password).then(async (authData) => {
        // if (authData.record.emailVisibility) {
          await pb.collection("users").update(authData.record.id, {
            emailVisibility: true,
          })
        // }
        console.log('Authenticated user:', authData.record);
      })
      console.log('Authenticated user:', user);

    //   // Ensure email visibility is true
    //   await pb.collection("users").update(user.record.id, {
    //     emailVisibility: true,
    //   })

    

      return { success: true, user };
    } catch (error) {
      console.error('Error during login:', error);
      return fail(500, { error: 'Failed to log in' });
    }
  }
}; 