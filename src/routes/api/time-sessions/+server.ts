import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { timeSessions, tasks, projects } from '$lib/server/db/schema';
import { eq, and, desc, gte, lte, isNotNull } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import type { RequestHandler } from './$types';
import type { NewTimeSession, TimeSessionWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const taskId = url.searchParams.get('task');
    const projectId = url.searchParams.get('project');
    const activeOnly = url.searchParams.get('active') === 'true';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const includeDetails = url.searchParams.get('details') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = db.select().from(timeSessions);
    const conditions = [];

    // Apply filters
    if (taskId) {
      conditions.push(eq(timeSessions.taskId, parseInt(taskId)));
    }
    
    if (projectId) {
      conditions.push(eq(timeSessions.projectId, parseInt(projectId)));
    }
    
    if (activeOnly) {
      conditions.push(eq(timeSessions.isActive, true));
    }
    
    if (startDate) {
      conditions.push(gte(timeSessions.startTime, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(timeSessions.startTime, new Date(endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const sessionList = await query
      .orderBy(desc(timeSessions.startTime))
      .limit(limit);

    if (!includeDetails) {
      return json(sessionList);
    }

    // Get details for each session
    const sessionsWithDetails: TimeSessionWithDetails[] = await Promise.all(
      sessionList.map(async (session) => {
        const [task, project] = await Promise.all([
          session.taskId 
            ? db.select().from(tasks).where(eq(tasks.id, session.taskId)).limit(1)
            : Promise.resolve([]),
          session.projectId
            ? db.select().from(projects).where(eq(projects.id, session.projectId)).limit(1)
            : Promise.resolve([])
        ]);

        return {
          ...session,
          task: task[0],
          project: project[0]
        };
      })
    );

    return json(sessionsWithDetails);
  } catch (error) {
    console.error('Error fetching time sessions:', error);
    return json({ error: 'Failed to fetch time sessions' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  requireAuth(event);
  const { request } = event;
  
  try {
    const data: NewTimeSession = await request.json();

    // Validate required fields
    if (!data.startTime) {
      return json({ error: 'Start time is required' }, { status: 400 });
    }

    // Either taskId or projectId must be provided
    if (!data.taskId && !data.projectId) {
      return json({ 
        error: 'Either task ID or project ID is required' 
      }, { status: 400 });
    }

    // If taskId is provided, get the project from the task
    let projectId = data.projectId;
    if (data.taskId && !projectId) {
      const [task] = await db.select({ projectId: tasks.projectId })
        .from(tasks)
        .where(eq(tasks.id, data.taskId))
        .limit(1);
      
      if (!task) {
        return json({ error: 'Task not found' }, { status: 404 });
      }
      projectId = task.projectId;
    }

    // Validate duration if provided
    if (data.duration !== undefined && data.duration < 0) {
      return json({ error: 'Duration cannot be negative' }, { status: 400 });
    }

    // If this is an active session, stop any other active sessions for the same task
    if (data.isActive) {
      if (data.taskId) {
        await db.update(timeSessions)
          .set({ isActive: false })
          .where(and(
            eq(timeSessions.taskId, data.taskId),
            eq(timeSessions.isActive, true)
          ));
      }
    }

    const sessionData: NewTimeSession = {
      taskId: data.taskId,
      projectId: projectId!,
      description: data.description?.trim() || null,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      duration: data.duration,
      isActive: data.isActive ?? false
    };

    const [newSession] = await db.insert(timeSessions)
      .values(sessionData)
      .returning();

    return json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating time session:', error);
    return json({ error: 'Failed to create time session' }, { status: 500 });
  }
};