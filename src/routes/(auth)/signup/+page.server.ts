import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ locals, request }) => {
    const data = Object.fromEntries(await request.formData()) as {
      name: string
      email: string
      password: string
      passwordConfirm: string
    }

    try {
      // Create user with emailVisibility set to true
      const userData = {
        ...data,
        emailVisibility: true
      };
      
      await locals.pb.collection('users').create(userData);
      await locals.pb
        .collection('users')
        .authWithPassword(data.email, data.password)
        .then(async (authData) => {
          // Ensure emailVisibility is true after auth
          await locals.pb.collection('users').update(authData.record.id, {
            emailVisibility: true
          });
        });
    } catch (e) {
      console.error(e)
      return {
        type: 'failure',
        data: {
          message: e.response?.data?.message || 'Failed to create account'
        }
      }
    }

    throw redirect(303, '/create-company')
  },
};