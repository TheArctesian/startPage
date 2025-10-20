/**
 * Drizzle Task Repository Implementation
 *
 * Concrete implementation of ITaskRepository using Drizzle ORM.
 * This implementation is injected into services, following Dependency Inversion.
 *
 * Benefits:
 * - Easy to test (can mock the interface)
 * - Database implementation can be swapped
 * - Business logic doesn't depend on ORM details
 */

import { eq, and, or, desc, asc, ilike, gte, lte, count as drizzleCount } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  ITaskRepository,
  TaskFilters,
  UpdateTaskDTO
} from '../interfaces/task.repository';
import type { PaginatedResult, PaginationOptions } from '../interfaces/base.repository';
import type { Task, NewTask, TaskStatus } from '$lib/types/database';
import { tasks } from '$lib/server/db/schema';

export class DrizzleTaskRepository implements ITaskRepository {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Find all tasks matching filters
   */
  async findAll(filters?: TaskFilters): Promise<Task[]> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select().from(tasks);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Default ordering: most recent first
    const results = await query.orderBy(desc(tasks.createdAt));
    return results as Task[];
  }

  /**
   * Find task by ID
   */
  async findById(id: number): Promise<Task | null> {
    const results = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    return results[0] as Task || null;
  }

  /**
   * Find one task matching filters
   */
  async findOne(filters: Partial<TaskFilters>): Promise<Task | null> {
    const conditions = this.buildFilterConditions(filters);

    if (conditions.length === 0) {
      return null;
    }

    const results = await this.db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .limit(1);

    return results[0] as Task || null;
  }

  /**
   * Create a new task
   */
  async create(data: NewTask): Promise<Task> {
    const results = await this.db
      .insert(tasks)
      .values(data)
      .returning();

    return results[0] as Task;
  }

  /**
   * Update a task
   */
  async update(id: number, data: UpdateTaskDTO): Promise<Task> {
    const results = await this.db
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!results[0]) {
      throw new Error(`Task with ID ${id} not found`);
    }

    return results[0] as Task;
  }

  /**
   * Delete a task
   */
  async delete(id: number): Promise<boolean> {
    const results = await this.db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    return results.length > 0;
  }

  /**
   * Count tasks matching filters
   */
  async count(filters?: TaskFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db
      .select({ count: drizzleCount() })
      .from(tasks);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;
    return results[0]?.count || 0;
  }

  /**
   * Check if task exists
   */
  async exists(id: number): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  /**
   * Find tasks by project with pagination
   */
  async findByProject(
    projectId: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Task>> {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;

    // Get total count
    const totalResults = await this.db
      .select({ count: drizzleCount() })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const total = totalResults[0]?.count || 0;

    // Get paginated items
    const items = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: items as Task[],
      total,
      page: Math.floor(offset / limit),
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find tasks by status
   */
  async findByStatus(status: TaskStatus, projectId?: number): Promise<Task[]> {
    const conditions = [eq(tasks.status, status)];

    if (projectId !== undefined) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    const results = await this.db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    return results as Task[];
  }

  /**
   * Find in-progress tasks for a user
   */
  async findInProgressByUser(userId: number): Promise<Task[]> {
    // Note: Assumes tasks have an assignedTo field or we join with user permissions
    // For now, return all in-progress tasks (can be refined with user permissions)
    return this.findByStatus('in_progress');
  }

  /**
   * Find tasks due in date range
   */
  async findDueInRange(startDate: Date, endDate: Date, projectId?: number): Promise<Task[]> {
    const conditions = [
      gte(tasks.dueDate, startDate.toISOString()),
      lte(tasks.dueDate, endDate.toISOString())
    ];

    if (projectId !== undefined) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    const results = await this.db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.dueDate));

    return results as Task[];
  }

  /**
   * Complete a task
   */
  async complete(id: number, actualIntensity: number, actualMinutes?: number): Promise<Task> {
    return this.update(id, {
      status: 'done',
      actualIntensity,
      actualMinutes: actualMinutes || null,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Reorder tasks in a column
   */
  async reorder(taskIds: number[], column: string): Promise<boolean> {
    // Update position for each task
    const updates = taskIds.map((taskId, index) =>
      this.db
        .update(tasks)
        .set({
          position: index,
          boardColumn: column
        })
        .where(eq(tasks.id, taskId))
    );

    try {
      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      return false;
    }
  }

  /**
   * Get task statistics for a project
   */
  async getStatsByProject(projectId: number): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    archived: number;
  }> {
    const allTasks = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const stats = {
      total: allTasks.length,
      todo: 0,
      inProgress: 0,
      done: 0,
      archived: 0
    };

    for (const task of allTasks) {
      switch (task.status) {
        case 'todo':
          stats.todo++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'done':
          stats.done++;
          break;
        case 'archived':
          stats.archived++;
          break;
      }
    }

    return stats;
  }

  /**
   * Archive old completed tasks
   */
  async archiveCompleted(olderThan: Date, projectId?: number): Promise<number> {
    const conditions = [
      eq(tasks.status, 'done'),
      lte(tasks.completedAt, olderThan.toISOString())
    ];

    if (projectId !== undefined) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    const results = await this.db
      .update(tasks)
      .set({ status: 'archived' })
      .where(and(...conditions))
      .returning();

    return results.length;
  }

  /**
   * Build filter conditions from TaskFilters object
   * @private
   */
  private buildFilterConditions(filters?: TaskFilters): any[] {
    if (!filters) return [];

    const conditions = [];

    if (filters.projectId !== undefined) {
      conditions.push(eq(tasks.projectId, filters.projectId));
    }

    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(tasks.title, `%${filters.search}%`),
          ilike(tasks.description, `%${filters.search}%`)
        )
      );
    }

    if (filters.createdAfter) {
      conditions.push(gte(tasks.createdAt, filters.createdAfter.toISOString()));
    }

    if (filters.createdBefore) {
      conditions.push(lte(tasks.createdAt, filters.createdBefore.toISOString()));
    }

    if (filters.dueAfter) {
      conditions.push(gte(tasks.dueDate, filters.dueAfter.toISOString()));
    }

    if (filters.dueBefore) {
      conditions.push(lte(tasks.dueDate, filters.dueBefore.toISOString()));
    }

    if (!filters.includeArchived) {
      conditions.push(eq(tasks.status, 'archived'));
    }

    return conditions;
  }
}
