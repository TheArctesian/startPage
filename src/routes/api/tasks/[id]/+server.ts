import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks, projects, timeSessions } from '$lib/server/db/schema';
import { eq, sum, isNotNull } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import type { RequestHandler } from './$types';
import type { TaskWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const taskId = parseInt(params.id);
    const includeDetails = url.searchParams.get('details') === 'true';

    if (isNaN(taskId)) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const [task] = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    if (!includeDetails) {
      return json(task);
    }

    // Get task details
    const [project, taskTimeSessions] = await Promise.all([
      // Get project
      db.select().from(projects).where(eq(projects.id, task.projectId!)).limit(1),
      
      // Get time sessions
      db.select().from(timeSessions).where(eq(timeSessions.taskId, taskId))
    ]);

    const taskWithDetails: TaskWithDetails = {
      ...task,
      project: project[0],
      timeSessions: taskTimeSessions
    };

    return json(taskWithDetails);
  } catch (error) {
    console.error('Error fetching task:', error);
    return json({ error: 'Failed to fetch task' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async (event) => {
  requireAuth(event);
  const { params, request } = event;
  
  try {
    const taskId = parseInt(params.id);
    
    if (isNaN(taskId)) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const updates = await request.json();

    // For PATCH, allow partial updates without strict validation
    if (updates.status !== undefined) {
      // Validate status values
      const validStatuses = ['todo', 'in_progress', 'done', 'archived'];
      if (!validStatuses.includes(updates.status)) {
        return json({ error: 'Invalid status value' }, { status: 400 });
      }
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    const [updatedTask] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning();

    if (!updatedTask) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async (event) => {
  requireAuth(event);
  const { params, request } = event;
  
  try {
    const taskId = parseInt(params.id);
    
    if (isNaN(taskId)) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const updates = await request.json();

    // Validate updates
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim().length === 0) {
        return json({ error: 'Task title cannot be empty' }, { status: 400 });
      }
      if (updates.title.length > 500) {
        return json({ error: 'Task title must be less than 500 characters' }, { status: 400 });
      }
      updates.title = updates.title.trim();
    }

    if (updates.estimatedMinutes !== undefined) {
      if (updates.estimatedMinutes < 1 || updates.estimatedMinutes > 1440) {
        return json({ 
          error: 'Estimated minutes must be between 1 and 1440 (24 hours)' 
        }, { status: 400 });
      }
    }

    if (updates.estimatedIntensity !== undefined) {
      if (updates.estimatedIntensity < 1 || updates.estimatedIntensity > 5) {
        return json({ 
          error: 'Estimated intensity must be between 1 and 5' 
        }, { status: 400 });
      }
    }

    if (updates.actualIntensity !== undefined) {
      if (updates.actualIntensity < 1 || updates.actualIntensity > 5) {
        return json({ 
          error: 'Actual intensity must be between 1 and 5' 
        }, { status: 400 });
      }
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    const [updatedTask] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning();

    if (!updatedTask) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return json({ error: 'Failed to update task' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async (event) => {
  requireAuth(event);
  const { params } = event;
  
  try {
    const taskId = parseInt(params.id);

    if (isNaN(taskId)) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const [deletedTask] = await db.delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning();

    if (!deletedTask) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (error) {
    console.error('Error deleting task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
};