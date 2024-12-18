import { createInstance } from '$lib/pocketbase'
import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  const publicRoutes = [
    '/login',
    '/signup',
    '/api',
    '/embed',
    '/embed/leadform/[id]',
    '/invite/accept/[id]',
    '/embed/leadbox/[id]'
  ];
  
  const rolePermissions = {
    owner: ['manage_team', 'manage_settings', 'manage_billing', 'view_analytics'],
    admin: ['manage_team', 'manage_settings', 'view_analytics'],
    member: ['view_analytics']
  };
  
  const pb = createInstance()

  // load the store data from the request cookie string
  pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '')
  try {
    // get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
    if (pb.authStore.isValid && !publicRoutes.includes(event.url.pathname)) {
      await pb.collection('users').authRefresh()
    }
  } catch (_) {
    // clear the auth store on failed refresh
    pb.authStore.clear()
  }

  event.locals.pb = pb
  event.locals.user = pb.authStore.record

  const response = await resolve(event)

  // send back the default 'pb_auth' cookie to the client with the latest store state
  response.headers.set(
    'set-cookie',
    pb.authStore.exportToCookie({ httpOnly: false }),
  )

  return response
}