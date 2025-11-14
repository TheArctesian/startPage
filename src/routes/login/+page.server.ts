import { redirect, fail } from '@sveltejs/kit';
import {
  authenticateUser,
  createSession,
  logUserActivity
} from '$lib/server/auth';
import { authLogger, logCookieOperation } from '$lib/server/auth/debug';
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
      authLogger.info('Attempting authentication', { username });
      const user = await authenticateUser(username, password);

      if (!user) {
        authLogger.warn('Authentication failed - invalid credentials', { username });
        return fail(400, { error: 'Invalid username or password' });
      }

      authLogger.info('Authentication successful', {
        userId: user.id,
        username: user.username,
        status: user.status
      });

      if (user.status === 'pending') {
        authLogger.info('User pending approval, redirecting', { userId: user.id });
        throw redirect(302, '/pending-approval');
      }

      if (user.status === 'suspended') {
        authLogger.warn('Login attempt for suspended account', { userId: user.id });
        return fail(400, { error: 'Account suspended. Please contact an administrator.' });
      }

      // Create session
      authLogger.info('Creating session', { userId: user.id, username: user.username });
      const sessionId = await createSession(
        user.id,
        getClientAddress(),
        request.headers.get('user-agent') || undefined
      );
      authLogger.info('Session created', { sessionId: sessionId.slice(0, 8) + '...', userId: user.id });

      // Set secure cookie
      cookies.set('session-id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Lax keeps CSRF protection while letting Firefox send cookies after reloads
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      logCookieOperation('set', { sessionId: sessionId.slice(0, 8) + '...', success: true });

      // CRITICAL: Verify cookie was actually set
      const verifySessionId = cookies.get('session-id');
      logCookieOperation('verify', {
        expected: sessionId.slice(0, 8) + '...',
        actual: verifySessionId?.slice(0, 8) + '...',
        success: verifySessionId === sessionId
      });

      if (verifySessionId !== sessionId) {
        authLogger.error('Cookie verification failed', {
          expected: sessionId,
          got: verifySessionId,
          cookieOptions: { path: '/', httpOnly: true, sameSite: 'lax' }
        });
        return fail(500, {
          error: 'Authentication succeeded but session cookie failed to set. Please try again.'
        });
      }

      authLogger.info('Cookie verified successfully, redirecting', { userId: user.id });

      // Log login activity
      await logUserActivity(
        user.id,
        'login',
        'user',
        user.id,
        getClientAddress(),
        { username: user.username }
      );

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
      authLogger.info('Creating anonymous session');

      // Create anonymous session
      const sessionId = await createSession(
        undefined, // no user ID for anonymous
        getClientAddress(),
        request.headers.get('user-agent') || undefined
      );

      authLogger.info('Anonymous session created', { sessionId: sessionId.slice(0, 8) + '...' });

      // Set secure cookie
      cookies.set('session-id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Required so Firefox can reuse the cookie on fresh navigations
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });

      logCookieOperation('set', { sessionId: sessionId.slice(0, 8) + '...', success: true });

      // Verify cookie was set
      const verifySessionId = cookies.get('session-id');
      logCookieOperation('verify', {
        expected: sessionId.slice(0, 8) + '...',
        actual: verifySessionId?.slice(0, 8) + '...',
        success: verifySessionId === sessionId
      });

      if (verifySessionId !== sessionId) {
        authLogger.error('Anonymous session cookie verification failed', {
          expected: sessionId,
          got: verifySessionId
        });
        return fail(500, {
          error: 'Failed to create browsing session. Please try again.'
        });
      }

      authLogger.info('Anonymous session cookie verified, redirecting');

      throw redirect(302, redirectTarget);
    } catch (error: any) {
      // Re-throw redirects (they have status and location properties)
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }
      authLogger.error('Lurk session error', { error: String(error) });
      return fail(500, { error: 'Failed to create browsing session' });
    }
  }
};
