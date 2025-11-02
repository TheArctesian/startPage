import { db } from './db';
import { projectUsers, projects, users } from './db/schema';
import { eq, and, or, isNotNull } from 'drizzle-orm';
import type { User, PublicUser, PermissionLevel } from '$lib/types/database';

/**
 * Check if a user has specific permission level for a project
 */
export async function hasProjectPermission(
  userId: number | undefined | null,
  projectId: number,
  requiredLevel: PermissionLevel = 'view_only'
): Promise<boolean> {
  // No user means no permissions (anonymous users only see public projects)
  if (!userId) {
    const [project] = await db
      .select({ isPublic: projects.isPublic })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    return project?.isPublic ?? false;
  }

  // Check if user is admin (admins have full access to all projects)
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.role === 'admin') {
    return true;
  }

  // Check if project is public (anyone can view)
  if (requiredLevel === 'view_only') {
    const [project] = await db
      .select({ isPublic: projects.isPublic })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    if (project?.isPublic) {
      return true;
    }
  }

  // Check user's specific permission for this project
  const [permission] = await db
    .select({ permissionLevel: projectUsers.permissionLevel })
    .from(projectUsers)
    .where(
      and(
        eq(projectUsers.userId, userId),
        eq(projectUsers.projectId, projectId)
      )
    )
    .limit(1);

  if (!permission) {
    return false;
  }

  // Permission hierarchy: project_admin > editor > view_only
  const userLevel = permission.permissionLevel;
  
  switch (requiredLevel) {
    case 'view_only':
      return ['view_only', 'editor', 'project_admin'].includes(userLevel);
    case 'editor':
      return ['editor', 'project_admin'].includes(userLevel);
    case 'project_admin':
      return userLevel === 'project_admin';
    default:
      return false;
  }
}

/**
 * Check if user is admin or has project admin permissions
 */
export async function isAdminOrProjectAdmin(
  user: PublicUser | null,
  projectId?: number
): Promise<boolean> {
  if (!user) return false;

  // Global admin can do anything
  if (user.role === 'admin') return true;

  // Check project admin permission if projectId provided
  if (projectId) {
    return await hasProjectPermission(user.id, projectId, 'project_admin');
  }

  return false;
}

/**
 * Get user's permission level for a project
 */
export async function getUserProjectPermission(
  userId: number,
  projectId: number
): Promise<PermissionLevel | null> {
  const [permission] = await db
    .select({ permissionLevel: projectUsers.permissionLevel })
    .from(projectUsers)
    .where(
      and(
        eq(projectUsers.userId, userId),
        eq(projectUsers.projectId, projectId)
      )
    )
    .limit(1);

  return permission?.permissionLevel ?? null;
}

/**
 * Get all projects visible to a user with their permission levels
 */
export async function getUserVisibleProjects(userId: number | null) {
  if (!userId) {
    // Anonymous users only see public projects
    return await db
      .select()
      .from(projects)
      .where(eq(projects.isPublic, true));
  }

  // Check if user is admin
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.role === 'admin') {
    // Admin users see all projects
    return await db
      .select()
      .from(projects)
      .orderBy(projects.depth, projects.name);
  }

  // Get user's projects and public projects
  const userProjects = await db
    .select({
      project: projects,
      permissionLevel: projectUsers.permissionLevel
    })
    .from(projects)
    .leftJoin(
      projectUsers,
      and(
        eq(projectUsers.projectId, projects.id),
        eq(projectUsers.userId, userId)
      )
    )
    .where(
      // Either project is public OR user has explicit permission
      or(
        eq(projects.isPublic, true),
        isNotNull(projectUsers.permissionLevel)
      )
    );

  // Map to include permission level
  return userProjects
    .map(({ project, permissionLevel }) => ({
      ...project,
      userPermission: permissionLevel
    }));
}

/**
 * Grant permission to a user for a project
 */
export async function grantProjectPermission(
  userId: number,
  projectId: number,
  permissionLevel: PermissionLevel,
  grantedBy: number
): Promise<void> {
  await db
    .insert(projectUsers)
    .values({
      userId,
      projectId,
      permissionLevel,
      grantedBy
    })
    .onConflictDoUpdate({
      target: [projectUsers.userId, projectUsers.projectId],
      set: {
        permissionLevel,
        grantedBy,
        grantedAt: new Date()
      }
    });
}

/**
 * Revoke user's permission for a project
 */
export async function revokeProjectPermission(
  userId: number,
  projectId: number
): Promise<void> {
  await db
    .delete(projectUsers)
    .where(
      and(
        eq(projectUsers.userId, userId),
        eq(projectUsers.projectId, projectId)
      )
    );
}