import { json } from '@sveltejs/kit';
import { taskService } from '$lib/server/services';
import { ValidationException } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const taskId = parseInt(params.id);

    if (isNaN(taskId)) {
      return json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const { actualIntensity, actualMinutes } = await request.json();

    // Use service layer for completion with validation and accuracy calculation
    const result = await taskService.completeTask(taskId, actualIntensity, actualMinutes);

    return json(result);
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('already completed')) {
        return json({ error: error.message }, { status: 409 });
      }
    }

    console.error('Error completing task:', error);
    return json({ error: 'Failed to complete task' }, { status: 500 });
  }
};