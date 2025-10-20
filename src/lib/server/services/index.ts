/**
 * Service Layer
 *
 * Central export point for business logic services following SOLID principles.
 *
 * Services orchestrate:
 * - Repository operations (data access)
 * - Validation rules (input validation)
 * - Business rules (domain logic)
 *
 * Usage:
 * ```typescript
 * import { taskService } from '$lib/server/services';
 *
 * const task = await taskService.createTask(taskData);
 * ```
 *
 * Following DIP: Services depend on repository abstractions
 * Following SRP: Each service handles one entity's business logic
 */

// Import repositories
import {
	taskRepository,
	projectRepository,
	quickLinkRepository
} from '../repositories';

// Import services
export { TaskService } from './task.service';
export { ProjectService } from './project.service';
export { QuickLinkService } from './quicklink.service';

// Create singleton instances
import { TaskService } from './task.service';
import { ProjectService } from './project.service';
import { QuickLinkService } from './quicklink.service';

export const taskService = new TaskService(taskRepository);
export const projectService = new ProjectService(projectRepository);
export const quickLinkService = new QuickLinkService(quickLinkRepository);

/**
 * Service factory for testing and custom instances
 */
export class ServiceFactory {
	static createTaskService(taskRepo: any) {
		return new TaskService(taskRepo);
	}

	static createProjectService(projectRepo: any) {
		return new ProjectService(projectRepo);
	}

	static createQuickLinkService(quickLinkRepo: any) {
		return new QuickLinkService(quickLinkRepo);
	}
}
