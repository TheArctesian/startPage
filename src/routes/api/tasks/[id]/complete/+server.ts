import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const taskId = parseInt(params.id);
    
    if (isNaN(taskId)) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const { actualIntensity, actualMinutes } = await request.json();

    // Validate actual intensity (required)
    if (!actualIntensity || actualIntensity < 1 || actualIntensity > 5) {
      return json({
        error: 'Actual intensity is required and must be between 1 and 5'
      }, { status: 400 });
    }

    // Validate actual minutes (now required)
    if (!actualMinutes || actualMinutes < 0) {
      return json({
        error: 'Actual minutes is required and must be non-negative'
      }, { status: 400 });
    }

    // Get current task
    const [currentTask] = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!currentTask) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    if (currentTask.status === 'done') {
      return json({ error: 'Task is already completed' }, { status: 409 });
    }

    // Update task as completed
    const [completedTask] = await db.update(tasks)
      .set({
        status: 'done',
        actualIntensity,
        actualMinutes,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return json({
      task: completedTask,
      estimationAccuracy: {
        timeAccuracy: actualMinutes && currentTask.estimatedMinutes
          ? Math.round(((actualMinutes - currentTask.estimatedMinutes) / currentTask.estimatedMinutes) * 100)
          : null,
        intensityMatch: actualIntensity === currentTask.estimatedIntensity,
        estimatedMinutes: currentTask.estimatedMinutes,
        actualMinutes,
        estimatedIntensity: currentTask.estimatedIntensity,
        actualIntensity
      }
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return json({ error: 'Failed to complete task' }, { status: 500 });
  }
};