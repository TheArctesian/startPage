import { json } from '@sveltejs/kit';
import { taskService } from '$lib/server/services';
import { ValidationException } from '$lib/server/validation';
import { requireAuth, requireEditAccess } from '$lib/server/auth-guard';
import { logUserActivity } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import type { NewTask, TaskStatus, Priority } from '$lib/types/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');

    // Build filters
    const filters: any = {};

    if (projectId) {
      filters.projectId = parseInt(projectId);
    }

    if (status) {
      filters.status = status as TaskStatus;
    }

    if (priority) {
      filters.priority = priority as Priority;
    }

    if (search) {
      filters.search = search;
    }

    // Use service layer to get tasks
    const taskList = await taskService.searchTasks(search || '', projectId ? parseInt(projectId) : undefined);

    return json(taskList);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  requireAuth(event);
  const { request, locals, getClientAddress } = event;

  try {
    const data: NewTask = await request.json();

    // Check project access
    if (data.projectId) {
      requireEditAccess(event, data.projectId);
    }

    // Set defaults
    const taskData: NewTask = {
      ...data,
      title: data.title?.trim(),
      description: data.description?.trim() || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      boardColumn: data.boardColumn || 'todo',
      position: data.position || 0
    };

    // Use service layer for creation with validation
    const newTask = await taskService.createTask(taskData);

    // Log activity
    await logUserActivity(
      locals.user!.id,
      'create',
      'task',
      newTask.id,
      getClientAddress(),
      { taskTitle: newTask.title, projectId: data.projectId }
    );

    return json(newTask, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }

    console.error('Error creating task:', error);
    return json({ error: 'Failed to create task' }, { status: 500 });
  }
};