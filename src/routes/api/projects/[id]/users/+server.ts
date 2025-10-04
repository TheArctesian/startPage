import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projectUsers, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import { hasProjectPermission, grantProjectPermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  requireAuth(event);
  const { params, locals } = event;
  
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Check if user has admin permission for this project
    const hasPermission = await hasProjectPermission(locals.user!.id, projectId, 'project_admin');
    if (!hasPermission && locals.user!.role !== 'admin') {
      return json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users with permissions for this project
    const projectUsersList = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        permissionLevel: projectUsers.permissionLevel,
        grantedAt: projectUsers.grantedAt
      })
      .from(projectUsers)
      .innerJoin(users, eq(projectUsers.userId, users.id))
      .where(eq(projectUsers.projectId, projectId))
      .orderBy(projectUsers.grantedAt);

    return json(projectUsersList);
  } catch (error) {
    console.error('Error fetching project users:', error);
    return json({ error: 'Failed to fetch project users' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  requireAuth(event);
  const { params, locals, request } = event;
  
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Check if user has admin permission for this project
    const hasPermission = await hasProjectPermission(locals.user!.id, projectId, 'project_admin');
    if (!hasPermission && locals.user!.role !== 'admin') {
      return json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { userEmail, permissionLevel } = await request.json();

    if (!userEmail || !permissionLevel) {
      return json({ error: 'User email and permission level are required' }, { status: 400 });
    }

    // Find user by email
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!targetUser) {
      return json({ error: 'User not found with that email address' }, { status: 404 });
    }

    // Check if user already has permission for this project
    const [existingPermission] = await db
      .select()
      .from(projectUsers)
      .where(and(
        eq(projectUsers.userId, targetUser.id),
        eq(projectUsers.projectId, projectId)
      ))
      .limit(1);

    if (existingPermission) {
      return json({ error: 'User already has access to this project' }, { status: 400 });
    }

    // Grant permission
    await grantProjectPermission(
      targetUser.id,
      projectId,
      permissionLevel,
      locals.user!.id
    );

    return json({ message: 'User permission added successfully' });
  } catch (error) {
    console.error('Error adding user permission:', error);
    return json({ error: 'Failed to add user permission' }, { status: 500 });
  }
};