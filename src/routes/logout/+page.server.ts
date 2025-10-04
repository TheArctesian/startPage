import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  // Delete session if it exists
  if (locals.sessionId) {
    await deleteSession(locals.sessionId);
  }
  
  // Clear session cookie
  cookies.delete('session-id', { path: '/' });
  
  // Redirect to login
  throw redirect(302, '/login');
};