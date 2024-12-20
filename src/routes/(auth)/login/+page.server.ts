import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { ClientResponseError } from 'pocketbase'

export const actions: Actions = {
  default: async ({ locals, request }) => {
    const data = Object.fromEntries(await request.formData()) as {
      email: string
      password: string
    }

    try {
      await locals.pb
        .collection('users')
        .authWithPassword(data.email, data.password)
        .then(async (authData) => {
          // Set emailVisibility to true after successful login
          await locals.pb.collection('users').update(authData.record.id, {
            emailVisibility: true
          });
        });
    } catch (err: any) {
      console.error(err)
      console.log('Error: ', err);
			if (err instanceof ClientResponseError) {
				switch (err.status) {
					case 400:
						return { success: false, message: 'Invalid email or password' };
					case 401:
						return { success: false, message: 'Email not verified' };
					case 403:
						return { success: false, message: 'Account is disabled' };
					default:
						return { success: false, message: 'An unexpected error occurred' };
				}
			}
			return { success: false, message: 'An unexpected error occurred' };
    }

    throw redirect(303, '/')
  },
}