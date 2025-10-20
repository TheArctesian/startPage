/**
 * Task Repository Interface
 *
 * Defines task-specific data access operations.
 * Extends base repository with task-specific methods.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles task data access
 * - Interface Segregation: Focused on task operations only
 * - Dependency Inversion: Abstracts database implementation
 */

import type { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository';
import type { Task, NewTask, TaskStatus, Priority } from '$lib/types/database';

/**
 * Filter options for task queries
 */
export interface TaskFilters {
  /** Filter by project ID */
  projectId?: number;
  /** Filter by status */
  status?: TaskStatus;
  /** Filter by priority */
  priority?: Priority;
  /** Search in title or description */
  search?: string;
  /** Filter by creation date range */
  createdAfter?: Date;
  createdBefore?: Date;
  /** Filter by due date range */
  dueAfter?: Date;
  dueBefore?: Date;
  /** Filter by assigned user */
  assignedTo?: number;
  /** Include archived tasks */
  includeArchived?: boolean;
}

/**
 * Data for updating a task
 */
export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  estimatedMinutes?: number;
  estimatedIntensity?: number;
  actualMinutes?: number | null;
  actualIntensity?: number | null;
  dueDate?: string | null;
  boardColumn?: string;
  position?: number;
  completedAt?: string | null;
}

/**
 * Task repository interface with task-specific operations
 */
export interface ITaskRepository extends IBaseRepository<Task, NewTask, UpdateTaskDTO, TaskFilters> {
  /**
   * Find tasks by project with pagination
   * @param projectId - Project identifier
   * @param pagination - Pagination options
   * @returns Paginated task results
   */
  findByProject(projectId: number, pagination?: PaginationOptions): Promise<PaginatedResult<Task>>;

  /**
   * Find tasks by status
   * @param status - Task status to filter by
   * @param projectId - Optional project filter
   * @returns Promise resolving to tasks
   */
  findByStatus(status: TaskStatus, projectId?: number): Promise<Task[]>;

  /**
   * Find in-progress tasks for a user
   * @param userId - User identifier
   * @returns Promise resolving to in-progress tasks
   */
  findInProgressByUser(userId: number): Promise<Task[]>;

  /**
   * Find tasks due within date range
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param projectId - Optional project filter
   * @returns Promise resolving to tasks
   */
  findDueInRange(startDate: Date, endDate: Date, projectId?: number): Promise<Task[]>;

  /**
   * Complete a task with actual values
   * @param id - Task identifier
   * @param actualIntensity - Actual effort intensity (1-5)
   * @param actualMinutes - Optional actual time spent
   * @returns Promise resolving to updated task
   */
  complete(id: number, actualIntensity: number, actualMinutes?: number): Promise<Task>;

  /**
   * Reorder tasks within a board column
   * @param taskIds - Array of task IDs in new order
   * @param column - Board column name
   * @returns Promise resolving to success boolean
   */
  reorder(taskIds: number[], column: string): Promise<boolean>;

  /**
   * Get task statistics for a project
   * @param projectId - Project identifier
   * @returns Promise resolving to statistics object
   */
  getStatsByProject(projectId: number): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    archived: number;
  }>;

  /**
   * Archive old completed tasks
   * @param olderThan - Archive tasks completed before this date
   * @param projectId - Optional project filter
   * @returns Promise resolving to number of archived tasks
   */
  archiveCompleted(olderThan: Date, projectId?: number): Promise<number>;
}
