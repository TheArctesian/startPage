import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, tasks, timeSessions, quickLinks } from '$lib/server/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { ProjectWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const projectId = parseInt(params.id);
    const includeDetails = url.searchParams.get('details') === 'true';

    if (isNaN(projectId)) {
      return json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const [project] = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return json({ error: 'Project not found' }, { status: 404 });
    }

    if (!includeDetails) {
      return json(project);
    }

    // Get full project details
    const [projectTasks, projectQuickLinks, timeData] = await Promise.all([
      // Get all tasks for this project
      db.select().from(tasks).where(eq(tasks.projectId, projectId)),
      
      // Get quick links
      db.select().from(quickLinks)
        .where(eq(quickLinks.projectId, projectId))
        .orderBy(quickLinks.position, quickLinks.title),
      
      // Get time data
      db.select({ duration: timeSessions.duration })
        .from(timeSessions)
        .where(and(
          eq(timeSessions.projectId, projectId),
          isNotNull(timeSessions.duration)
        ))
    ]);

    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.status === 'done').length;
    const totalMinutes = Math.round(
      timeData.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
    );

    const projectWithDetails: ProjectWithDetails = {
      ...project,
      tasks: projectTasks,
      quickLinks: projectQuickLinks,
      totalTasks,
      completedTasks,
      totalMinutes
    };

    return json(projectWithDetails);
  } catch (error) {
    console.error('Error fetching project:', error);
    return json({ error: 'Failed to fetch project' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const projectId = parseInt(params.id);
    
    if (isNaN(projectId)) {
      return json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const updates = await request.json();

    // Validate updates
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        return json({ error: 'Project name cannot be empty' }, { status: 400 });
      }
      if (updates.name.length > 255) {
        return json({ error: 'Project name must be less than 255 characters' }, { status: 400 });
      }
      updates.name = updates.name.trim();
    }

    // Validate parentId if provided
    if (updates.parentId !== undefined) {
      if (updates.parentId !== null) {
        // Check if parent exists
        const [parentProject] = await db.select()
          .from(projects)
          .where(eq(projects.id, updates.parentId))
          .limit(1);
        
        if (!parentProject) {
          return json({ error: 'Parent project not found' }, { status: 400 });
        }

        // Prevent circular references - check if the target parent is a descendant
        const [currentProject] = await db.select()
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1);

        if (currentProject?.path && parentProject.path?.startsWith(currentProject.path + '/')) {
          return json({ error: 'Cannot set parent to a descendant project' }, { status: 400 });
        }
      }

      // Calculate new hierarchical fields
      if (updates.parentId === null) {
        // Moving to root level
        updates.depth = 0;
        updates.path = updates.name || (await db.select({ name: projects.name })
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1))[0]?.name;
      } else {
        // Moving under a parent - get the parent project
        const [parentProject] = await db.select()
          .from(projects)
          .where(eq(projects.id, updates.parentId))
          .limit(1);
        
        if (parentProject) {
          updates.depth = (parentProject.depth || 0) + 1;
          const projectName = updates.name || (await db.select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1))[0]?.name;
          updates.path = `${parentProject.path}/${projectName}`;
        }
      }
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    const [updatedProject] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, projectId))
      .returning();

    if (!updatedProject) {
      return json({ error: 'Project not found' }, { status: 404 });
    }

    return json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return json({ error: 'Failed to update project' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const projectId = parseInt(params.id);
    
    if (isNaN(projectId)) {
      return json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const updates = await request.json();

    // Validate status update if provided
    if (updates.status !== undefined) {
      const validStatuses = ['active', 'done', 'archived'];
      if (!validStatuses.includes(updates.status)) {
        return json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate other fields if provided
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        return json({ error: 'Project name cannot be empty' }, { status: 400 });
      }
      if (updates.name.length > 255) {
        return json({ error: 'Project name must be less than 255 characters' }, { status: 400 });
      }
      updates.name = updates.name.trim();
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    const [updatedProject] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, projectId))
      .returning();

    if (!updatedProject) {
      return json({ error: 'Project not found' }, { status: 404 });
    }

    return json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return json({ error: 'Failed to update project' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, url }) => {
  try {
    const projectId = parseInt(params.id);
    const force = url.searchParams.get('force') === 'true';

    if (isNaN(projectId)) {
      return json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Check if project has tasks (unless force delete)
    if (!force) {
      const projectTasks = await db.select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .limit(1);

      if (projectTasks.length > 0) {
        return json(
          { 
            error: 'Cannot delete project with tasks. Use ?force=true to delete anyway.',
            hasData: true 
          }, 
          { status: 409 }
        );
      }
    }

    const [deletedProject] = await db.delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (!deletedProject) {
      return json({ error: 'Project not found' }, { status: 404 });
    }

    return json({ message: 'Project deleted successfully', project: deletedProject });
  } catch (error) {
    console.error('Error deleting project:', error);
    return json({ error: 'Failed to delete project' }, { status: 500 });
  }
};