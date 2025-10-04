import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { hasProjectPermission, isAdminOrProjectAdmin } from './permissions';
import type { PermissionLevel } from '$lib/types/database';

export function requireAuth(event: RequestEvent) {
  if (!event.locals.user || event.locals.user.status !== 'approved') {
    throw error(401, 'Authentication required');
  }
}

export async function requireProjectAccess(
  event: RequestEvent, 
  projectId: number, 
  level: PermissionLevel = 'view_only'
) {
  const userId = event.locals.user?.id;
  
  const hasAccess = await hasProjectPermission(userId, projectId, level);
  if (!hasAccess) {
    throw error(403, `${level} access denied to this project`);
  }
}

export async function requireEditAccess(event: RequestEvent, projectId: number) {
  await requireProjectAccess(event, projectId, 'editor');
}

export async function requireProjectAdminAccess(event: RequestEvent, projectId: number) {
  await requireProjectAccess(event, projectId, 'project_admin');
}

export function requireAdmin(event: RequestEvent) {
  requireAuth(event);
  
  if (event.locals.user!.role !== 'admin') {
    throw error(403, 'Admin access required');
  }
}

export async function requireAdminOrProjectAdmin(event: RequestEvent, projectId?: number) {
  requireAuth(event);
  
  const isAuthorized = await isAdminOrProjectAdmin(event.locals.user!, projectId);
  if (!isAuthorized) {
    throw error(403, 'Admin or project admin access required');
  }
}