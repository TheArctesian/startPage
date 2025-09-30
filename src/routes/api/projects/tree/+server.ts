import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, tasks, timeSessions } from '$lib/server/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { ProjectWithDetails } from '$lib/types/database';
import { buildProjectTree } from '$lib/utils/projectTree';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const includeStats = url.searchParams.get('stats') !== 'false'; // Default to true
    const activeOnly = url.searchParams.get('active') !== 'false'; // Default to true

    // Fetch all projects ordered by depth then name for proper tree structure
    let query = db.select().from(projects);
    
    if (activeOnly) {
      query = query.where(eq(projects.isActive, true));
    }

    const projectList = await query.orderBy(projects.depth, projects.name);

    if (!includeStats) {
      // Build tree without stats
      const treeData = buildProjectTree(projectList);
      return json(treeData);
    }

    // Get stats for each project
    const projectsWithStats: ProjectWithDetails[] = await Promise.all(
      projectList.map(async (project) => {
        // Get task counts
        const allTasks = await db.select({ id: tasks.id, status: tasks.status })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(task => task.status === 'done').length;

        // Get total time spent
        const timeData = await db.select({ duration: timeSessions.duration })
          .from(timeSessions)
          .where(and(
            eq(timeSessions.projectId, project.id),
            isNotNull(timeSessions.duration)
          ));

        const totalMinutes = Math.round(
          timeData.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
        );

        return {
          ...project,
          totalTasks,
          completedTasks,
          totalMinutes
        };
      })
    );

    // Build tree structure with stats
    const treeData = buildProjectTree(projectsWithStats);
    
    return json(treeData);
  } catch (error) {
    console.error('Error fetching project tree:', error);
    return json({ error: 'Failed to fetch project tree' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { projectId, isExpanded } = data;

    if (!projectId || typeof isExpanded !== 'boolean') {
      return json(
        { error: 'Project ID and isExpanded are required' }, 
        { status: 400 }
      );
    }

    // Update the expanded state
    const [updatedProject] = await db.update(projects)
      .set({ 
        isExpanded,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updatedProject) {
      return json(
        { error: 'Project not found' }, 
        { status: 404 }
      );
    }

    return json(updatedProject);
  } catch (error) {
    console.error('Error updating project tree state:', error);
    return json({ error: 'Failed to update project tree state' }, { status: 500 });
  }
};