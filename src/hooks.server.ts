import { pb } from '$lib/pocketbase';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const publicRoutes = [
  '/login',
  '/signup',
  '/',
  '/embed/leadbox',
  '/api/public',
  '/api/messages'
];

export const handle: Handle = async ({ event, resolve }) => {
  // Clear auth store at the start of each request to prevent state persistence
  pb.authStore.clear();
  
  const isPublicRoute = publicRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );

  try {
    // Load auth from cookie
    const cookie = event.request.headers.get('cookie');
    const pbAuthCookie = cookie?.split(';')
      .find(c => c.trim().startsWith('pb_auth='));
    
    if (pbAuthCookie) {
      pb.authStore.loadFromCookie(`${pbAuthCookie.trim()}`);
    }
    
    event.locals.pb = pb;
    event.locals.user = null; // Reset user

    // Verify the token is valid
    if (pb.authStore.isValid) {
      try {
        // Verify and refresh token
        const authData = await pb.collection('users').authRefresh();
        event.locals.user = authData.record;
      } catch (err) {
        // If refresh fails, clear everything
        pb.authStore.clear();
        event.cookies.delete('pb_auth', { path: '/' });
      }
    }

    // If not public route and no valid user, redirect to login
    if (!isPublicRoute && !event.locals.user) {
      throw redirect(303, '/login');
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

  // Only set cookie if we have a valid user
  if (event.locals.user && pb.authStore.isValid) {
    response.headers.append('set-cookie', pb.authStore.exportToCookie({
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/'
    }));
  }

  return response;
}; 