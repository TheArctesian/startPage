import type { User } from '$lib/types/database';

/**
 * Auth utility functions for checking user permissions and status
 */

/**
 * Check if user is authenticated (logged in with approved status)
 */
export function isAuthenticated(user?: User | null): boolean {
  if (user === undefined) return false;
  return user !== null && user.status === 'approved';
}

/**
 * Check if user is anonymous/lurking
 */
export function isAnonymous(user?: User | null): boolean {
  if (user === undefined) return true;
  return user === null;
}

/**
 * Check if user is an admin
 */
export function isAdmin(user?: User | null): boolean {
  if (user === undefined) return false;
  return user !== null && user.role === 'admin';
}

/**
 * Check if user is a member (authenticated non-admin)
 */
export function isMember(user?: User | null): boolean {
  if (user === undefined) return false;
  return user !== null && user.status === 'approved' && user.role === 'member';
}

/**
 * Check if user can edit (authenticated user or has specific edit permissions)
 */
export function canEdit(user?: User | null): boolean {
  if (user === undefined) return false;
  return isAuthenticated(user);
}

/**
 * Check if user has access to a project (based on projectAccess field)
 */
export function hasProjectAccess(projectId: number, user?: User | null): boolean {
  const currentUser = user ?? null;

  if (!currentUser || !isAuthenticated(currentUser)) {
    return false;
  }
  
  // Admin has access to all projects
  if (isAdmin(currentUser)) {
    return true;
  }
  
  // Check projectAccess array
  try {
    const accessibleProjects = JSON.parse(currentUser.projectAccess || '[]');
    return accessibleProjects.includes(projectId);
  } catch (e) {
    console.warn('Failed to parse projectAccess:', e);
    return false;
  }
}

/**
 * Check if user is suspended
 */
export function isSuspended(user?: User | null): boolean {
  if (user === undefined) return false;
  return user !== null && user.status === 'suspended';
}

/**
 * Check if user is pending approval
 */
export function isPending(user?: User | null): boolean {
  if (user === undefined) return false;
  return user !== null && user.status === 'pending';
}

/**
 * Get user's display name
 */
export function getUserDisplayName(user?: User | null): string {
  const currentUser = user ?? null;

  if (!currentUser) {
    return 'Anonymous';
  }
  
  return currentUser.username || 'Unknown User';
}

/**
 * Get current user from store
 */
export function getCurrentUser(): User | null {
  return null;
}

/**
 * Check if user can perform admin actions
 */
export function canPerformAdminActions(user?: User | null): boolean {
  return isAdmin(user);
}

/**
 * Check if user needs to be redirected based on their status
 */
export function getRedirectPath(user: User | null): string | null {
  if (!user) {
    return null; // Anonymous users can stay on current page
  }
  
  if (user.status === 'pending') {
    return '/pending-approval';
  }
  
  if (user.status === 'suspended') {
    return '/login'; // Redirect suspended users to login
  }
  
  return null; // No redirect needed
}
