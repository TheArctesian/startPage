import { json } from '@sveltejs/kit';
import { taskService } from '$lib/server/services';
import { ValidationException } from '$lib/server/validation';
import { requireAuth } from '$lib/server/auth-guard';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const taskId = parseInt(params.id);

    if (isNaN(taskId)) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const task = await taskService.getTaskById(taskId);

    if (!task) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json(task);
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

    // Use service layer for update with validation
    const updatedTask = await taskService.updateTask(taskId, updates);

    return json(updatedTask);
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }

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

    // Use service layer for update with validation
    const updatedTask = await taskService.updateTask(taskId, updates);

    return json(updatedTask);
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }

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

    const success = await taskService.deleteTask(taskId);

    if (!success) {
      return json({ error: 'Task not found' }, { status: 404 });
    }

    return json({ message: 'Task deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }

    console.error('Error deleting task:', error);
    return json({ error: 'Failed to delete task' }, { status: 500 });
  }
};