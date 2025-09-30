import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { timeSessions, tasks } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Verify task exists and get project ID
    const [task] = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    // Stop any currently active sessions for this task
    const activeSessions = await db.select()
      .from(timeSessions)
      .where(and(
        eq(timeSessions.taskId, taskId),
        eq(timeSessions.isActive, true)
      ));

    const endTime = new Date();
    for (const session of activeSessions) {
      const duration = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / 1000);
      await db.update(timeSessions)
        .set({ 
          isActive: false,
          endTime,
          duration
        })
        .where(eq(timeSessions.id, session.id));
    }

    // Create new active session
    const startTime = new Date();
    const [newSession] = await db.insert(timeSessions)
      .values({
        taskId,
        projectId: task.projectId!,
        startTime,
        isActive: true
      })
      .returning();

    // Update task status to in_progress if it's not already
    if (task.status === 'todo') {
      await db.update(tasks)
        .set({ 
          status: 'in_progress',
          updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId));
    }

    return json({
      session: newSession,
      message: 'Timer started successfully'
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    return json({ error: 'Failed to start timer' }, { status: 500 });
  }
};