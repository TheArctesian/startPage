import { redirect, fail } from '@sveltejs/kit';
import {
  authenticateUser,
  createSession,
  logUserActivity
} from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

function sanitizeRedirect(target: string | null | undefined): string {
  if (!target) {
    return '/';
  }

  let candidate = target;
  try {
    candidate = decodeURIComponent(target);
  } catch {
    // keep original value if decoding fails
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/';
  }

  // avoid loops back to auth screens
  if (candidate === '/login' || candidate === '/signup') {
    return '/';
  }

  return candidate;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const redirectTo = sanitizeRedirect(url.searchParams.get('redirectTo'));

  // If already authenticated with a real user account, redirect to destination
  if (locals.user && locals.user.status === 'approved') {
    throw redirect(302, redirectTo);
  }

  // Allow anonymous users to access login page
  return { redirectTo };
};

export const actions: Actions = {
  login: async ({ request, cookies, getClientAddress, url }) => {
    const data = await request.formData();
    const username = data.get('username') as string;
    const password = data.get('password') as string;
    const submittedRedirect = data.get('redirectTo') as string | null;
    const redirectTarget = sanitizeRedirect(
      submittedRedirect ?? url.searchParams.get('redirectTo')
    );

    if (!username) {
      return fail(400, { error: 'Username is required' });
    }

    if (!password) {
      return fail(400, { error: 'Password is required' });
    }

    try {
      console.log('Attempting to authenticate user:', username);
      const user = await authenticateUser(username, password);
      console.log('Authentication result:', user ? { id: user.id, username: user.username, status: user.status } : null);
      
      if (!user) {
        return fail(400, { error: 'Invalid username or password' });
      }

      if (user.status === 'pending') {
        throw redirect(302, '/pending-approval');
      }

      if (user.status === 'suspended') {
        return fail(400, { error: 'Account suspended. Please contact an administrator.' });
      }

      // Create session
      console.log('Creating session for user:', user.id);
      const sessionId = await createSession(
        user.id, 
        getClientAddress(), 
        request.headers.get('user-agent') || undefined
      );
      console.log('Session created:', sessionId);
      
      // Log login activity
      await logUserActivity(
        user.id,
        'login',
        'user',
        user.id,
        getClientAddress(),
        { username: user.username }
      );
      console.log('Activity logged');
      
      // Set secure cookie
      cookies.set('session-id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
      console.log('Cookie set, redirecting...');

      throw redirect(302, redirectTarget);
    } catch (error: any) {
      // Re-throw redirects (they have status and location properties)
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      console.error('Login error:', error);
      return fail(500, { error: 'Login failed' });
    }
  },

  lurk: async ({ cookies, getClientAddress, request, url }) => {
    const data = await request.formData();
    const submittedRedirect = data.get('redirectTo') as string | null;
    const redirectTarget = sanitizeRedirect(
      submittedRedirect ?? url.searchParams.get('redirectTo')
    );

    try {
      // Create anonymous session
      const sessionId = await createSession(
        undefined, // no user ID for anonymous
        getClientAddress(),
        request.headers.get('user-agent') || undefined
      );
      
      // Set secure cookie
      cookies.set('session-id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      throw redirect(302, redirectTarget);
    } catch (error: any) {
      // Re-throw redirects (they have status and location properties)
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      console.error('Lurk session error:', error);
      return fail(500, { error: 'Failed to create browsing session' });
    }
  }
};
