import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks, timeSessions } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
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

    // Calculate actual minutes if not provided
    let calculatedActualMinutes = actualMinutes;
    
    if (!calculatedActualMinutes) {
      // Stop any active timer for this task
      const activeSession = await db.select()
        .from(timeSessions)
        .where(and(
          eq(timeSessions.taskId, taskId),
          eq(timeSessions.isActive, true)
        ))
        .limit(1);

      if (activeSession.length > 0) {
        const endTime = new Date();
        const startTime = activeSession[0].startTime;
        const sessionDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        
        // Update the active session
        await db.update(timeSessions)
          .set({
            endTime,
            duration: sessionDuration,
            isActive: false
          })
          .where(eq(timeSessions.id, activeSession[0].id));
      }

      // Calculate total time from all sessions
      const allSessions = await db.select({ duration: timeSessions.duration })
        .from(timeSessions)
        .where(and(
          eq(timeSessions.taskId, taskId),
          isNull(timeSessions.endTime) === false
        ));

      calculatedActualMinutes = Math.round(
        allSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
      );
    }

    // Update task as completed
    const [completedTask] = await db.update(tasks)
      .set({
        status: 'done',
        actualIntensity,
        actualMinutes: calculatedActualMinutes,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return json({
      task: completedTask,
      estimationAccuracy: {
        timeAccuracy: calculatedActualMinutes && currentTask.estimatedMinutes 
          ? Math.round(((calculatedActualMinutes - currentTask.estimatedMinutes) / currentTask.estimatedMinutes) * 100)
          : null,
        intensityMatch: actualIntensity === currentTask.estimatedIntensity,
        estimatedMinutes: currentTask.estimatedMinutes,
        actualMinutes: calculatedActualMinutes,
        estimatedIntensity: currentTask.estimatedIntensity,
        actualIntensity
      }
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return json({ error: 'Failed to complete task' }, { status: 500 });
  }
};