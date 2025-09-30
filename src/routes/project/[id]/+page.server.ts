import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
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
    
    // Return the found project
    return {
      project,
      projectPath: project.path || project.name,
      breadcrumb: project.path && project.path !== project.name ? project.path : project.name
    };
    
  } catch (err) {
    console.error('❌ Error loading project with ID:', projectId);
    console.error('❌ Error details:', err);
    
    error(500, 'Failed to load project');
  }
};