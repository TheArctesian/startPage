// Task-related store actions
import { get } from 'svelte/store';
import { storeLogger } from '$lib/utils/logger';
import {
  tasks,
  selectedTask,
  isLoading,
  loadingTasks
} from './index';
import type {
  NewTask,
  Task,
  IntensityLevel
} from '$lib/types/database';
import { handleStoreError, clearStoreError } from './storeErrorHandling';

// TASK ACTIONS
export async function loadTasks(projectId?: number) {
  loadingTasks.set(true);
  clearStoreError();

  try {
    const url = projectId
      ? `/api/tasks?project=${projectId}&details=true`
      : '/api/tasks?details=true';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to load tasks');
    }

    const data = await response.json();
    storeLogger.debug(`Loaded ${data.length} tasks for project ${projectId}`, data);
    tasks.set(data);
  } catch (err) {
    handleStoreError(err, 'Failed to load tasks');
  } finally {
    loadingTasks.set(false);
  }
}

export async function createTask(taskData: NewTask) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create task');
    }

    const newTask = await response.json();

    // Add to store
    tasks.update(list => [...list, newTask]);

    return newTask;
  } catch (err) {
    handleStoreError(err, 'Failed to create task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function updateTask(id: number, updates: Partial<Task>) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update task');
    }

    const updatedTask = await response.json();

    // Update in store
    tasks.update(list =>
      list.map(t => t.id === id ? updatedTask : t)
    );

    return updatedTask;
  } catch (err) {
    handleStoreError(err, 'Failed to update task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function completeTask(id: number, actualIntensity: IntensityLevel) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch(`/api/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualIntensity })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to complete task');
    }

    const { task: completedTask, estimationAccuracy } = await response.json();

    // Update in store
    tasks.update(list =>
      list.map(t => t.id === id ? completedTask : t)
    );

    // Clear selected task if it was the completed one
    const current = get(selectedTask);
    if (current && current.id === id) {
      selectedTask.set(null);
    }

    return { task: completedTask, estimationAccuracy };
  } catch (err) {
    handleStoreError(err, 'Failed to complete task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

export async function deleteTask(id: number) {
  isLoading.set(true);
  clearStoreError();

  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete task');
    }

    // Remove from store
    tasks.update(list => list.filter(t => t.id !== id));

    // Clear selected task if it was the deleted one
    const current = get(selectedTask);
    if (current && current.id === id) {
      selectedTask.set(null);
    }

    return true;
  } catch (err) {
    handleStoreError(err, 'Failed to delete task');
    throw err;
  } finally {
    isLoading.set(false);
  }
}

// UTILITY ACTIONS
export function setSelectedTask(task: Task | null) {
  selectedTask.set(task);
}
