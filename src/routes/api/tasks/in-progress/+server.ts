import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks, projects, timeSessions } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { TaskWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Fetch all in-progress tasks with project details
    const inProgressTasks = await db
      .select({
        // Task fields
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
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
        // Project fields (flattened)
        projectName: projects.name,
        projectDescription: projects.description,
        projectColor: projects.color,
        projectStatus: projects.status,
        projectCreatedAt: projects.createdAt,
        projectUpdatedAt: projects.updatedAt
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(tasks.status, 'in_progress'),
          eq(projects.status, 'active') // Only show tasks from active projects
        )
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(limit);

    // Get time sessions for each task
    const tasksWithDetails: TaskWithDetails[] = await Promise.all(
      inProgressTasks.map(async (taskData) => {
        const taskTimeSessions = await db
          .select()
          .from(timeSessions)
          .where(eq(timeSessions.taskId, taskData.id));

        return {
          id: taskData.id,
          title: taskData.title,
          description: taskData.description,
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
          project: {
            id: taskData.projectId,
            name: taskData.projectName,
            description: taskData.projectDescription,
            color: taskData.projectColor,
            status: taskData.projectStatus,
            createdAt: taskData.projectCreatedAt,
            updatedAt: taskData.projectUpdatedAt
          },
          timeSessions: taskTimeSessions
        };
      })
    );

    return json(tasksWithDetails);
  } catch (error) {
    console.error('Error fetching in-progress tasks:', error);
    return json({ error: 'Failed to fetch in-progress tasks' }, { status: 500 });
  }
};