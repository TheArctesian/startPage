import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projectUsers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import { hasProjectPermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async (event) => {
  requireAuth(event);
  const { params, locals, request } = event;
  
  try {
    const projectId = parseInt(params.id);
    const userId = parseInt(params.userId);
    
    if (isNaN(projectId) || isNaN(userId)) {
      return json({ error: 'Invalid project or user ID' }, { status: 400 });
    }

    // Check if user has admin permission for this project
    const hasPermission = await hasProjectPermission(locals.user!.id, projectId, 'project_admin');
    if (!hasPermission && locals.user!.role !== 'admin') {
      return json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { permissionLevel } = await request.json();

    if (!permissionLevel) {
      return json({ error: 'Permission level is required' }, { status: 400 });
    }

    // Update user permission
    const [updatedPermission] = await db
      .update(projectUsers)
      .set({
        permissionLevel,
        grantedAt: new Date()
      })
      .where(and(
        eq(projectUsers.userId, userId),
        eq(projectUsers.projectId, projectId)
      ))
      .returning();

    if (!updatedPermission) {
      return json({ error: 'User permission not found' }, { status: 404 });
    }

    return json({ message: 'User permission updated successfully' });
  } catch (error) {
    console.error('Error updating user permission:', error);
    return json({ error: 'Failed to update user permission' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async (event) => {
  requireAuth(event);
  const { params, locals } = event;
  
  try {
    const projectId = parseInt(params.id);
    const userId = parseInt(params.userId);
    
    if (isNaN(projectId) || isNaN(userId)) {
      return json({ error: 'Invalid project or user ID' }, { status: 400 });
    }

    // Check if user has admin permission for this project
    const hasPermission = await hasProjectPermission(locals.user!.id, projectId, 'project_admin');
    if (!hasPermission && locals.user!.role !== 'admin') {
      return json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Remove user permission
    const result = await db
      .delete(projectUsers)
      .where(and(
        eq(projectUsers.userId, userId),
        eq(projectUsers.projectId, projectId)
      ));

    return json({ message: 'User permission removed successfully' });
  } catch (error) {
    console.error('Error removing user permission:', error);
    return json({ error: 'Failed to remove user permission' }, { status: 500 });
  }
};