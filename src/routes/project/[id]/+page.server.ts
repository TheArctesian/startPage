import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hasProjectPermission, getUserProjectPermission } from '$lib/server/permissions';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;
  
  // Validate ID parameter
  const projectId = parseInt(id);
  if (isNaN(projectId) || projectId <= 0) {
    error(404, 'Invalid project ID');
  }

  try {
    // Simple database lookup by ID
    const projectResults = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    if (projectResults.length === 0) {
      error(404, `Project not found with ID: ${projectId}`);
    }
    
    const project = projectResults[0];

    // Check user permissions for this project
    const userId = locals.user?.id;
    const hasViewAccess = await hasProjectPermission(userId, projectId, 'view_only');
    
    if (!hasViewAccess) {
      error(403, 'Access denied to this project');
    }

    // Get user's specific permission level for this project
    let userPermission: string | null = null;
    if (userId) {
      if (locals.user?.role === 'admin') {
        userPermission = 'admin'; // Global admin has all permissions
      } else {
        userPermission = await getUserProjectPermission(userId, projectId);
      }
    }
    
    // Return the found project with permission info
    return {
      project,
      projectPath: project.path || project.name,
      breadcrumb: project.path && project.path !== project.name ? project.path : project.name,
      userPermission,
      isAuthenticated: !!locals.user,
      canEdit: userPermission === 'editor' || userPermission === 'project_admin' || userPermission === 'admin'
    };
    
  } catch (err) {
    console.error('❌ Error loading project with ID:', projectId);
    console.error('❌ Error details:', err);
    
    error(500, 'Failed to load project');
  }
};