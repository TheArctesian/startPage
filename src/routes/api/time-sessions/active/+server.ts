import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { timeSessions, tasks, projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { TimeSessionWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async () => {
  try {
    // Get all active sessions
    const activeSessions = await db.select()
      .from(timeSessions)
      .where(eq(timeSessions.isActive, true));

    if (activeSessions.length === 0) {
      return json({ activeSession: null });
    }

    // Should only be one active session, but get the most recent one just in case
    const session = activeSessions[activeSessions.length - 1];

    // Get session details
    const [task, project] = await Promise.all([
      session.taskId 
        ? db.select().from(tasks).where(eq(tasks.id, session.taskId)).limit(1)
        : Promise.resolve([]),
      session.projectId
        ? db.select().from(projects).where(eq(projects.id, session.projectId)).limit(1)
        : Promise.resolve([])
    ]);

    const sessionWithDetails: TimeSessionWithDetails = {
      ...session,
      task: task[0],
      project: project[0]
    };

    // Calculate elapsed time
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    return json({
      activeSession: sessionWithDetails,
      elapsedSeconds
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    return json({ error: 'Failed to fetch active session' }, { status: 500 });
  }
};