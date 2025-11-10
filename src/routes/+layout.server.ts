import type { LayoutServerLoad } from './$types';
import { authLogger } from '$lib/server/auth/debug';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user ?? null;
  const isUserAuthenticated = user !== null && user.status === 'approved';

  authLogger.debug('Layout load', {
    hasUser: !!user,
    userId: user?.id,
    isAuthenticated: isUserAuthenticated,
    isAnonymous: !isUserAuthenticated
  });

  return {
    user,
    isAnonymous: !isUserAuthenticated, // Always consistent with user state
    isAuthenticated: isUserAuthenticated,
    canEdit: isUserAuthenticated,
    sessionId: locals.sessionId
  };
};
