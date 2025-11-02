import type { Task, TaskWithDetails, TaskFormData, IntensityLevel } from '$lib/types/database';

/**
 * Fetch all tasks, optionally filtered by project
 * @param projectId - Optional project ID to filter tasks
 */
export async function fetchTasks(projectId?: number): Promise<TaskWithDetails[]> {
	const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks';
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
	return res.json();
}

/**
 * Fetch tasks currently in progress
 */
export async function fetchInProgressTasks(): Promise<TaskWithDetails[]> {
	const res = await fetch('/api/tasks/in-progress');
	if (!res.ok) throw new Error(`Failed to fetch in-progress tasks: ${res.status}`);
	return res.json();
}

/**
 * Fetch a single task by ID
 */
export async function fetchTask(id: number): Promise<TaskWithDetails> {
	const res = await fetch(`/api/tasks/${id}`);
	if (!res.ok) throw new Error(`Failed to fetch task: ${res.status}`);
	return res.json();
}

/**
 * Create a new task
 */
export async function createTask(data: TaskFormData): Promise<TaskWithDetails> {
	const res = await fetch('/api/tasks', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(`Failed to create task: ${res.status}`);
	return res.json();
}

/**
 * Update an existing task
 */
export async function updateTask(id: number, data: Partial<TaskFormData>): Promise<TaskWithDetails> {
	const res = await fetch(`/api/tasks/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error(`Failed to update task: ${res.status}`);
	return res.json();
}

/**
 * Delete a task
 */
export async function deleteTask(id: number): Promise<void> {
	const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error(`Failed to delete task: ${res.status}`);
}

/**
 * Complete a task with actual intensity rating
 */
export async function completeTask(
	id: number,
	actualIntensity: IntensityLevel,
	actualMinutes?: number
): Promise<TaskWithDetails> {
	const payload: Record<string, unknown> = { actualIntensity };

	if (typeof actualMinutes === 'number' && !Number.isNaN(actualMinutes)) {
		payload.actualMinutes = actualMinutes;
	}

	const res = await fetch(`/api/tasks/${id}/complete`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error(`Failed to complete task: ${res.status}`);
	return res.json();
}
