import type { LayoutServerLoad } from './$types';
import { isAuthenticated, canEdit } from '$lib/utils/auth';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
    isAnonymous: locals.isAnonymous,
    isAuthenticated: isAuthenticated(locals.user),
    canEdit: canEdit(locals.user),
    sessionId: locals.sessionId
  };
};