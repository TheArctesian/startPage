import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // If user is authenticated, show the dashboard with full permissions
  if (locals.user && locals.user.status === 'approved') {
    return { 
      showDashboard: true,
      user: locals.user,
      isAuthenticated: true,
      canEdit: true,  // Full users can edit
      isAnonymous: false
    };
  }
  
  // For all other cases (anonymous/unauthenticated users), show dashboard in read-only mode
  return { 
    showDashboard: true, 
    isLurking: true,
    user: null,
    isAuthenticated: false,
    canEdit: false,  // Anonymous users cannot edit
    isAnonymous: true
  };
};