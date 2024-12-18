import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

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
    } catch (e) {
      console.error(e)
      throw e
    }

    throw redirect(303, '/')
  },
}