import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { timeSessions, tasks, projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { TimeSessionWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const sessionId = parseInt(params.id);
    const includeDetails = url.searchParams.get('details') === 'true';

    if (isNaN(sessionId)) {
      return json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const [session] = await db.select()
      .from(timeSessions)
      .where(eq(timeSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return json({ error: 'Time session not found' }, { status: 404 });
    }

    if (!includeDetails) {
      return json(session);
    }

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

    return json(sessionWithDetails);
  } catch (error) {
    console.error('Error fetching time session:', error);
    return json({ error: 'Failed to fetch time session' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const sessionId = parseInt(params.id);
    
    if (isNaN(sessionId)) {
      return json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const updates = await request.json();

    // Validate updates
    if (updates.duration !== undefined && updates.duration < 0) {
      return json({ error: 'Duration cannot be negative' }, { status: 400 });
    }

    if (updates.startTime) {
      updates.startTime = new Date(updates.startTime);
    }

    if (updates.endTime) {
      updates.endTime = new Date(updates.endTime);
    }

    const [updatedSession] = await db.update(timeSessions)
      .set(updates)
      .where(eq(timeSessions.id, sessionId))
      .returning();

    if (!updatedSession) {
      return json({ error: 'Time session not found' }, { status: 404 });
    }

    return json(updatedSession);
  } catch (error) {
    console.error('Error updating time session:', error);
    return json({ error: 'Failed to update time session' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const sessionId = parseInt(params.id);

    if (isNaN(sessionId)) {
      return json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const [deletedSession] = await db.delete(timeSessions)
      .where(eq(timeSessions.id, sessionId))
      .returning();

    if (!deletedSession) {
      return json({ error: 'Time session not found' }, { status: 404 });
    }

    return json({ message: 'Time session deleted successfully', session: deletedSession });
  } catch (error) {
    console.error('Error deleting time session:', error);
    return json({ error: 'Failed to delete time session' }, { status: 500 });
  }
};