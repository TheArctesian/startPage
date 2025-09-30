import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks, projects, timeSessions, tags, taskTags } from '$lib/server/db/schema';
import { eq, and, or, desc, asc, ilike, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { NewTask, TaskWithDetails, TaskFilters } from '$lib/types/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');
    const includeDetails = url.searchParams.get('details') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = db.select().from(tasks);
    const conditions = [];

    // Apply filters
    if (projectId) {
      conditions.push(eq(tasks.projectId, parseInt(projectId)));
    }
    
    if (status) {
      conditions.push(eq(tasks.status, status as any));
    }
    
    if (priority) {
      conditions.push(eq(tasks.priority, priority as any));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(tasks.title, `%${search}%`),
          ilike(tasks.description, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Default ordering: in_progress first, then by creation date
    const taskList = await query
      .orderBy(
        tasks.status === 'in_progress' ? asc(tasks.createdAt) : desc(tasks.createdAt)
      )
      .limit(limit)
      .offset(offset);

    if (!includeDetails) {
      return json(taskList);
    }

    // Get details for each task
    const tasksWithDetails: TaskWithDetails[] = await Promise.all(
      taskList.map(async (task) => {
        const [project, taskTimeSessions] = await Promise.all([
          // Get project
          db.select().from(projects).where(eq(projects.id, task.projectId!)).limit(1),
          
          // Get time sessions
          db.select().from(timeSessions).where(eq(timeSessions.taskId, task.id))
        ]);

        return {
          ...task,
          project: project[0],
          timeSessions: taskTimeSessions
        };
      })
    );

    return json(tasksWithDetails);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: NewTask = await request.json();

    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      return json({ error: 'Task title is required' }, { status: 400 });
    }

    if (data.title.length > 500) {
      return json({ error: 'Task title must be less than 500 characters' }, { status: 400 });
    }

    if (!data.projectId) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!data.estimatedMinutes || data.estimatedMinutes < 1 || data.estimatedMinutes > 1440) {
      return json({ 
        error: 'Estimated minutes must be between 1 and 1440 (24 hours)' 
      }, { status: 400 });
    }

    if (!data.estimatedIntensity || data.estimatedIntensity < 1 || data.estimatedIntensity > 5) {
      return json({ 
        error: 'Estimated intensity must be between 1 and 5' 
      }, { status: 400 });
    }

    // Verify project exists
    const [project] = await db.select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1);

    if (!project) {
      return json({ error: 'Project not found' }, { status: 404 });
    }

    // Set defaults and clean data
    const taskData: NewTask = {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      projectId: data.projectId,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      estimatedMinutes: data.estimatedMinutes,
      estimatedIntensity: data.estimatedIntensity,
      dueDate: data.dueDate,
      boardColumn: data.boardColumn || 'todo',
      position: data.position || 0
    };

    const [newTask] = await db.insert(tasks)
      .values(taskData)
      .returning();

    return json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return json({ error: 'Failed to create task' }, { status: 500 });
  }
};