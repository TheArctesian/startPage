/**
 * Task Service
 *
 * Business logic layer for task operations.
 * Orchestrates repositories and validators following SOLID principles.
 *
 * Following SRP: Only handles task business logic
 * Following DIP: Depends on repository and validator abstractions
 */

import type { ITaskRepository } from '../repositories/interfaces/task.repository';
import {
  createTaskValidator,
  updateTaskValidator,
  completeTaskValidator,
  TaskBusinessRules,
  ValidationException
} from '../validation';
import type { Task, NewTask, TaskStatus } from '$lib/types/database';
import type { UpdateTaskDTO } from '../repositories/interfaces/task.repository';

export class TaskService {
  constructor(private taskRepository: ITaskRepository) {}

  /**
   * Create a new task with validation
   */
  async createTask(data: NewTask): Promise<Task> {
    // Validate input
    createTaskValidator.validateOrThrow(data);

    // Apply business rules
    if (data.estimatedMinutes && data.estimatedIntensity) {
      const estimateCheck = TaskBusinessRules.validateEstimateReasonable(
        data.estimatedMinutes,
        data.estimatedIntensity
      );

      // Log warning but don't block
      if (!estimateCheck.valid) {
        console.warn('Task estimate warning:', estimateCheck.errors);
      }
    }

    // Create task
    return this.taskRepository.create(data);
  }

  /**
   * Update an existing task
   */
  async updateTask(id: number, data: UpdateTaskDTO): Promise<Task> {
    // Validate input
    updateTaskValidator.validateOrThrow(data);

    // Check if task exists
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      throw new Error(`Task with ID ${id} not found`);
    }

    // Validate status transition if status is being changed
    if (data.status && data.status !== existing.status) {
      const transitionCheck = TaskBusinessRules.canTransitionTo(
        existing.status,
        data.status
      );

      if (!transitionCheck.valid) {
        throw new ValidationException(transitionCheck.errors);
      }
    }

    // Update task
    return this.taskRepository.update(id, data);
  }

  /**
   * Complete a task with actual values
   */
  async completeTask(
    id: number,
    actualIntensity: number,
    actualMinutes?: number
  ): Promise<{
    task: Task;
    estimationAccuracy: {
      timeAccuracy?: number;
      intensityAccuracy: number;
    };
  }> {
    // Validate input
    completeTaskValidator.validateOrThrow({ actualIntensity, actualMinutes });

    // Get existing task
    const existing = await this.taskRepository.findById(id);
    if (!existing) {
      throw new Error(`Task with ID ${id} not found`);
    }

    // Check due date (warning only)
    if (existing.dueDate) {
      const dueDateCheck = TaskBusinessRules.validateDueDate(existing.dueDate);
      if (!dueDateCheck.valid) {
        console.warn('Task overdue:', dueDateCheck.errors);
      }
    }

    // Complete the task
    const task = await this.taskRepository.complete(id, actualIntensity, actualMinutes);

    // Calculate estimation accuracy
    const estimationAccuracy = this.calculateEstimationAccuracy(task);

    return { task, estimationAccuracy };
  }

  /**
   * Delete a task
   */
  async deleteTask(id: number): Promise<boolean> {
    const exists = await this.taskRepository.exists(id);
    if (!exists) {
      throw new Error(`Task with ID ${id} not found`);
    }

    return this.taskRepository.delete(id);
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: number): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }

  /**
   * Get all tasks for a project
   */
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return this.taskRepository.findAll({ projectId });
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatus, projectId?: number): Promise<Task[]> {
    return this.taskRepository.findByStatus(status, projectId);
  }

  /**
   * Get in-progress tasks for a user
   */
  async getInProgressTasks(userId: number): Promise<Task[]> {
    return this.taskRepository.findInProgressByUser(userId);
  }

  /**
   * Get tasks due soon
   */
  async getTasksDueSoon(projectId?: number, daysAhead = 7): Promise<Task[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    return this.taskRepository.findDueInRange(now, future, projectId);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(projectId?: number): Promise<Task[]> {
    const now = new Date();
    const farPast = new Date('2000-01-01');

    const allTasks = await this.taskRepository.findDueInRange(farPast, now, projectId);

    // Filter to only incomplete tasks
    return allTasks.filter(task => task.status !== 'done' && task.status !== 'archived');
  }

  /**
   * Reorder tasks within a board column
   */
  async reorderTasks(taskIds: number[], column: string): Promise<boolean> {
    return this.taskRepository.reorder(taskIds, column);
  }

  /**
   * Get task statistics for a project
   */
  async getProjectStats(projectId: number) {
    return this.taskRepository.getStatsByProject(projectId);
  }

  /**
   * Archive old completed tasks
   */
  async archiveOldTasks(olderThanDays: number, projectId?: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return this.taskRepository.archiveCompleted(cutoffDate, projectId);
  }

  /**
   * Search tasks
   */
  async searchTasks(searchQuery: string, projectId?: number): Promise<Task[]> {
    return this.taskRepository.findAll({
      search: searchQuery,
      projectId
    });
  }

  /**
   * Calculate estimation accuracy for a completed task
   * @private
   */
  private calculateEstimationAccuracy(task: Task): {
    timeAccuracy?: number;
    intensityAccuracy: number;
  } {
    const result: {
      timeAccuracy?: number;
      intensityAccuracy: number;
    } = {
      intensityAccuracy: 0
    };

    // Calculate intensity accuracy (0-100%)
    if (task.actualIntensity && task.estimatedIntensity) {
      const intensityDiff = Math.abs(task.actualIntensity - task.estimatedIntensity);
      result.intensityAccuracy = Math.max(0, (1 - intensityDiff / 4) * 100);
    }

    // Calculate time accuracy (0-100%)
    if (task.actualMinutes && task.estimatedMinutes) {
      const timeDiff = Math.abs(task.actualMinutes - task.estimatedMinutes);
      result.timeAccuracy = Math.max(0, (1 - timeDiff / task.estimatedMinutes) * 100);
    }

    return result;
  }

  /**
   * Batch update tasks
   */
  async batchUpdateTasks(updates: Array<{ id: number; data: UpdateTaskDTO }>): Promise<Task[]> {
    const updatedTasks: Task[] = [];

    for (const { id, data } of updates) {
      try {
        const updated = await this.updateTask(id, data);
        updatedTasks.push(updated);
      } catch (error) {
        console.error(`Failed to update task ${id}:`, error);
        // Continue with other updates
      }
    }

    return updatedTasks;
  }

  /**
   * Get task completion statistics
   */
  async getCompletionStats(projectId: number, startDate: Date, endDate: Date) {
    const tasks = await this.taskRepository.findAll({
      projectId,
      createdAfter: startDate,
      createdBefore: endDate
    });

    const completed = tasks.filter(t => t.status === 'done');

    return {
      total: tasks.length,
      completed: completed.length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      todo: tasks.filter(t => t.status === 'todo').length,
      completionRate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
      avgEstimatedMinutes: this.average(tasks.map(t => t.estimatedMinutes)),
      avgActualMinutes: this.average(completed.map(t => t.actualMinutes || 0)),
      avgEstimationAccuracy: this.calculateAvgAccuracy(completed)
    };
  }

  /**
   * Calculate average of numbers
   * @private
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate average estimation accuracy
   * @private
   */
  private calculateAvgAccuracy(tasks: Task[]): number {
    const accuracies = tasks
      .filter(t => t.actualMinutes && t.estimatedMinutes)
      .map(t => {
        const timeDiff = Math.abs(t.actualMinutes! - t.estimatedMinutes);
        return Math.max(0, (1 - timeDiff / t.estimatedMinutes) * 100);
      });

    return this.average(accuracies);
  }
}
