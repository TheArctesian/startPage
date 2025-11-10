import type { Handle } from '@sveltejs/kit';
import { validateSession, cleanupExpiredSessions, getUserById } from '$lib/server/auth';
import { authLogger, logCookieOperation, logSessionValidation } from '$lib/server/auth/debug';

export const handle: Handle = async ({ event, resolve }) => {
  // Clean up expired sessions periodically (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredSessions().catch(console.error);
  }

  // Get session from cookies
  const sessionId = event.cookies.get('session-id');

  logCookieOperation('get', {
    sessionId: sessionId?.slice(0, 8) + '...',
    success: !!sessionId
  });

  // Initialize defaults
  event.locals.user = undefined;
  event.locals.sessionId = sessionId;
  event.locals.isAnonymous = true;

  if (sessionId) {
    authLogger.debug('Validating session', { sessionId: sessionId.slice(0, 8) + '...' });

    const session = await validateSession(sessionId);

    if (session) {
      logSessionValidation(sessionId, {
        found: true,
        hasUser: !!session.userId
      });

      if (session.userId) {
        // Authenticated user session
        const user = await getUserById(session.userId);

        if (user) {
          authLogger.debug('User fetched from session', {
            userId: user.id,
            username: user.username,
            status: user.status
          });

          if (user.status === 'approved') {
            event.locals.user = user;
            event.locals.isAnonymous = false;
            authLogger.debug('User authenticated', { userId: user.id });
          } else {
            authLogger.warn('User session exists but not approved', {
              userId: user.id,
              status: user.status
            });
          }
        } else {
          authLogger.warn('Session has userId but user not found', { userId: session.userId });
        }
      } else {
        authLogger.debug('Anonymous session validated');
      }
    } else {
      logSessionValidation(sessionId, {
        found: false,
        expired: true
      });

      // Invalid/expired session - clear cookie
      authLogger.info('Clearing invalid session cookie');
      event.cookies.delete('session-id', { path: '/' });
      logCookieOperation('delete', { sessionId: sessionId.slice(0, 8) + '...', success: true });
      event.locals.sessionId = undefined;
    }
  } else {
    authLogger.debug('No session cookie present');
  }

  // Add cache control headers for all pages to ensure fresh auth state
  const response = await resolve(event);

  // Set no-cache headers for all responses to prevent stale auth states
  // This ensures that opening a new tab always validates the session cookie server-side
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  if (event.locals.user) {
    authLogger.debug('Added no-cache headers for authenticated response');
  } else {
    authLogger.debug('Added no-cache headers for unauthenticated response');
  }

  return response;
};