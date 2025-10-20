import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user ?? null;
  const isUserAuthenticated = user !== null && user.status === 'approved';

  return {
    user,
    isAnonymous: locals.isAnonymous,
    isAuthenticated: isUserAuthenticated,
    canEdit: isUserAuthenticated,
    sessionId: locals.sessionId
  };
};
