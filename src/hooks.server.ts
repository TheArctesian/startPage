import type { Handle } from '@sveltejs/kit';
import { validateSession, cleanupExpiredSessions, getUserById } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  // Clean up expired sessions periodically (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredSessions().catch(console.error);
  }

  // Get session from cookies
  const sessionId = event.cookies.get('session-id');
  
  // Initialize defaults
  event.locals.user = undefined;
  event.locals.sessionId = sessionId;
  event.locals.isAnonymous = true;

  if (sessionId) {
    const session = await validateSession(sessionId);
    
    if (session) {
      event.locals.isAnonymous = session.isAnonymous;
      
      if (session.userId) {
        // Authenticated user session
        const user = await getUserById(session.userId);
        if (user && user.status === 'approved') {
          event.locals.user = user;
          event.locals.isAnonymous = false;
        }
      }
      // For anonymous sessions, keep isAnonymous = true and user = undefined
    } else {
      // Invalid session, clear cookie
      event.cookies.delete('session-id', { path: '/' });
      event.locals.sessionId = undefined;
    }
  }

  return resolve(event);
};