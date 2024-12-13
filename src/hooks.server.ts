import { pb } from '$lib/pocketbase';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const publicRoutes = [
  '/login',
  '/signup',
  '/',
  '/embed/leadbox',
  '/api/public',
  '/api/messages'  // Add this line
];

export const handle: Handle = async ({ event, resolve }) => {
  const isPublicRoute = publicRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );

  try {
    // Load auth from cookie
    const cookie = event.request.headers.get('cookie');
    if (cookie) {
      pb.authStore.loadFromCookie(cookie);
    }
    
    event.locals.pb = pb;
    event.locals.user = pb.authStore.model;

    // Only try to refresh if we have a valid token and it's not a public route
    if (pb.authStore.isValid && !isPublicRoute) {
      try {
        await pb.collection('users').authRefresh();
      } catch (refreshError) {
        // If refresh fails, clear auth and redirect to login
        pb.authStore.clear();
        event.locals.user = null;
        throw redirect(303, '/login');
      }
    }
  } catch (error) {
    if (!isPublicRoute) {
      pb.authStore.clear();
      event.locals.user = null;
      event.cookies.delete('pb_auth', { path: '/' });
      throw redirect(303, '/login');
    }
  }

  const response = await resolve(event);

  if (pb.authStore.isValid) {
    response.headers.append('set-cookie', pb.authStore.exportToCookie({
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/'
    }));
  }

  return response;
}; 