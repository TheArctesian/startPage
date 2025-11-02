import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { Project, ProjectWithDetails } from '$lib/types/database';
import { buildProjectTree } from '$lib/utils/projectTree';
import { ProjectStatsService } from '$lib/server/projects/project-stats.service';

const projectStatsService = new ProjectStatsService();

export const GET: RequestHandler = async ({ url }) => {
  try {
    const includeStats = url.searchParams.get('stats') !== 'false'; // Default to true
    const activeOnly = url.searchParams.get('active') !== 'false'; // Default to true

    // Fetch all projects ordered by depth then name for proper tree structure
    let query = db.select().from(projects);

    if (activeOnly) {
      query = query.where(eq(projects.isActive, true)) as any;
    }

    const projectList = await query.orderBy(projects.depth, projects.name) as Project[];

    if (!includeStats) {
      // Build tree without stats
      const treeData = buildProjectTree(projectList);
      // Only return serializable data (roots and maxDepth)
      return json({
        roots: treeData.roots,
        maxDepth: treeData.maxDepth
      });
    }

    // Get stats for each project
    const statsMap = await projectStatsService.getDirectStats(projectList as { id: number }[]);
    const projectsWithStats: ProjectWithDetails[] = projectList.map((project) => {
      const stats = projectStatsService.getStatsForProject(project.id, statsMap);
      return {
        ...project,
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        inProgressTasks: stats.inProgressTasks,
        totalMinutes: stats.totalMinutes
      };
    });

    // Build tree structure with stats
    const treeData = buildProjectTree(projectsWithStats);

    // Only return serializable data (roots and maxDepth)
    return json({
      roots: treeData.roots,
      maxDepth: treeData.maxDepth
    });
  } catch (error) {
    console.error('Error fetching project tree:', error);
    return json({ error: 'Failed to fetch project tree' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { projectId, projectIds, isExpanded } = data;

    if (typeof isExpanded !== 'boolean') {
      return json(
        { error: 'isExpanded flag is required' }, 
        { status: 400 }
      );
    }

    const targetIds = Array.isArray(projectIds)
      ? projectIds.filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
      : (typeof projectId === 'number' ? [projectId] : []);

    if (targetIds.length === 0) {
      return json(
        { error: 'Project ID(s) are required' }, 
        { status: 400 }
      );
    }

    // Update the expanded state
    const updatedProjects = await db.update(projects)
      .set({ 
        isExpanded,
        updatedAt: new Date()
      })
      .where(inArray(projects.id, targetIds))
      .returning({
        id: projects.id,
        isExpanded: projects.isExpanded,
        updatedAt: projects.updatedAt
      });

    if (updatedProjects.length === 0) {
      return json(
        { error: 'Project(s) not found' }, 
        { status: 404 }
      );
    }

    // Preserve previous response shape for single updates
    if (!Array.isArray(projectIds) && updatedProjects.length === 1) {
      return json(updatedProjects[0]);
    }

    return json({ updatedIds: updatedProjects.map(project => project.id) });
  } catch (error) {
    console.error('Error updating project tree state:', error);
    return json({ error: 'Failed to update project tree state' }, { status: 500 });
  }
};
