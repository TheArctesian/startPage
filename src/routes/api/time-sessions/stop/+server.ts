import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { timeSessions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { sessionId, taskId } = await request.json();

    // Either sessionId or taskId must be provided
    if (!sessionId && !taskId) {
      return json({ 
        error: 'Either session ID or task ID is required' 
      }, { status: 400 });
    }

    const endTime = new Date();
    let updatedSession;

    if (sessionId) {
      // Get the session first to calculate duration
      const [currentSession] = await db.select()
        .from(timeSessions)
        .where(and(
          eq(timeSessions.id, sessionId),
          eq(timeSessions.isActive, true)
        ))
        .limit(1);

      if (!currentSession) {
        return json({ 
          error: 'Active session not found' 
        }, { status: 404 });
      }

      const duration = Math.floor((endTime.getTime() - new Date(currentSession.startTime).getTime()) / 1000);

      // Stop specific session
      const [session] = await db.update(timeSessions)
        .set({
          endTime,
          duration,
          isActive: false
        })
        .where(eq(timeSessions.id, sessionId))
        .returning();

      updatedSession = session;
    } else {
      // Get the active session for the task first
      const [currentSession] = await db.select()
        .from(timeSessions)
        .where(and(
          eq(timeSessions.taskId, taskId),
          eq(timeSessions.isActive, true)
        ))
        .limit(1);

      if (!currentSession) {
        return json({ 
          error: 'No active session found for this task' 
        }, { status: 404 });
      }

      const duration = Math.floor((endTime.getTime() - new Date(currentSession.startTime).getTime()) / 1000);

      // Stop active session for task
      const [session] = await db.update(timeSessions)
        .set({
          endTime,
          duration,
          isActive: false
        })
        .where(eq(timeSessions.id, currentSession.id))
        .returning();

      updatedSession = session;
    }

    return json({
      session: updatedSession,
      message: 'Timer stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    return json({ error: 'Failed to stop timer' }, { status: 500 });
  }
};