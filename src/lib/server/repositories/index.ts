/**
 * Repository Layer
 *
 * Central export point for repository layer following SOLID principles.
 *
 * Usage:
 * ```typescript
 * import { taskRepository, projectRepository } from '$lib/server/repositories';
 *
 * // Use in services or API routes
 * const tasks = await taskRepository.findByProject(projectId);
 * ```
 */

import { db } from '$lib/server/db';
import { DrizzleTaskRepository } from './implementations/drizzle-task.repository';
import { DrizzleProjectRepository } from './implementations/drizzle-project.repository';
import { DrizzleQuickLinkRepository } from './implementations/drizzle-quicklink.repository';

// Export interfaces for type checking and mocking
export * from './interfaces';

// Export implementations for direct use if needed
export * from './implementations';

// Create singleton instances with database connection
export const taskRepository = new DrizzleTaskRepository(db);
export const projectRepository = new DrizzleProjectRepository(db);
export const quickLinkRepository = new DrizzleQuickLinkRepository(db);

/**
 * Repository factory for dependency injection (useful for testing)
 */
export class RepositoryFactory {
  static createTaskRepository(database: any) {
    return new DrizzleTaskRepository(database);
  }

  static createProjectRepository(database: any) {
    return new DrizzleProjectRepository(database);
  }

  static createQuickLinkRepository(database: any) {
    return new DrizzleQuickLinkRepository(database);
  }
}
