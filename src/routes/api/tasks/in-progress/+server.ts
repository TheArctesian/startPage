import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks, projects } from '$lib/server/db/schema';
import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { hasProjectAccess } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import type { TaskWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const currentUser = locals.user;

    // Build project visibility conditions
    let projectConditions = [
      eq(projects.status, 'active'), // Only active projects
      eq(projects.isPublic, true) // Only public projects by default
    ];

    // If user is authenticated, they can also see their accessible private projects
    if (currentUser) {
      // Get user's accessible project IDs from their projectAccess field
      let accessibleProjectIds: number[] = [];
      try {
        accessibleProjectIds = JSON.parse(currentUser.projectAccess || '[]');
      } catch (e) {
        accessibleProjectIds = [];
      }

      // If user has specific project access, include those private projects too
      if (accessibleProjectIds.length > 0) {
        const projectVisibility = or(
          eq(projects.isPublic, true), // Public projects
          and(
            eq(projects.isPublic, false), // Private projects
            inArray(projects.id, accessibleProjectIds) // User has access
          )
        );
        projectConditions = [
          eq(projects.status, 'active'),
          projectVisibility!
        ];
      }
    }

    // Fetch all in-progress tasks with project details
    const inProgressTasks = await db
      .select({
        // Task fields
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        linkUrl: tasks.linkUrl,
        status: tasks.status,
        priority: tasks.priority,
        estimatedMinutes: tasks.estimatedMinutes,
        estimatedIntensity: tasks.estimatedIntensity,
        actualMinutes: tasks.actualMinutes,
        actualIntensity: tasks.actualIntensity,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectId: tasks.projectId,
        boardColumn: tasks.boardColumn,
        position: tasks.position,
        // Project fields (flattened)
        projectName: projects.name,
        projectDescription: projects.description,
        projectColor: projects.color,
        projectStatus: projects.status,
        projectCreatedAt: projects.createdAt,
        projectUpdatedAt: projects.updatedAt,
        projectIsPublic: projects.isPublic
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(tasks.status, 'in_progress'),
          ...projectConditions
        )
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(limit);

    // Map tasks with project details
    const tasksWithDetails: TaskWithDetails[] = inProgressTasks.map((taskData) => {
      return {
        id: taskData.id,
        title: taskData.title,
        description: taskData.description,
        linkUrl: taskData.linkUrl,
        status: taskData.status,
        priority: taskData.priority,
        estimatedMinutes: taskData.estimatedMinutes,
        estimatedIntensity: taskData.estimatedIntensity,
        actualMinutes: taskData.actualMinutes,
        actualIntensity: taskData.actualIntensity,
        dueDate: taskData.dueDate,
        completedAt: taskData.completedAt,
        createdAt: taskData.createdAt,
        updatedAt: taskData.updatedAt,
        projectId: taskData.projectId,
        boardColumn: taskData.boardColumn,
        position: taskData.position,
        project: {
          id: taskData.projectId,
          name: taskData.projectName,
          description: taskData.projectDescription,
          color: taskData.projectColor,
          status: taskData.projectStatus,
          isPublic: taskData.projectIsPublic,
          createdAt: taskData.projectCreatedAt,
          updatedAt: taskData.projectUpdatedAt
        }
      };
    });

    return json(tasksWithDetails);
  } catch (error) {
    console.error('Error fetching in-progress tasks:', error);
    return json({ error: 'Failed to fetch in-progress tasks' }, { status: 500 });
  }
};