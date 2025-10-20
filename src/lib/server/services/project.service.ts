/**
 * Project Service
 *
 * Business logic layer for project operations.
 * Orchestrates repositories and validators following SOLID principles.
 *
 * Following SRP: Only handles project business logic
 * Following DIP: Depends on repository and validator abstractions
 */

import type { IProjectRepository } from '../repositories/interfaces/project.repository';
import {
	createProjectValidator,
	updateProjectValidator,
	ProjectBusinessRules,
	ValidationException
} from '../validation';
import type { Project, NewProject, ProjectStatus } from '$lib/types/database';
import type { UpdateProjectDTO } from '../repositories/interfaces/project.repository';

export class ProjectService {
	constructor(private projectRepository: IProjectRepository) {}

	/**
	 * Create a new project with validation
	 */
	async createProject(data: NewProject): Promise<Project> {
		// Validate input
		createProjectValidator.validateOrThrow(data);

		// Validate unique name in parent (if business rule needed)
		// This is optional - can be enforced at DB level with unique constraint
		// or checked here if needed

		// Validate depth if has parent
		if (data.parentId) {
			const parent = await this.projectRepository.findById(data.parentId);
			if (!parent) {
				throw new Error(`Parent project with ID ${data.parentId} not found`);
			}

			// Calculate depth
			const ancestors = await this.projectRepository.findAncestors(data.parentId);
			const depth = ancestors.length + 1;
			const depthCheck = ProjectBusinessRules.validateMaxDepth(depth);

			if (!depthCheck.valid) {
				throw new ValidationException(depthCheck.errors);
			}
		}

		// Create project
		return this.projectRepository.create(data);
	}

	/**
	 * Update an existing project
	 */
	async updateProject(id: number, data: UpdateProjectDTO): Promise<Project> {
		// Validate input
		updateProjectValidator.validateOrThrow(data);

		// Check if project exists
		const existing = await this.projectRepository.findById(id);
		if (!existing) {
			throw new Error(`Project with ID ${id} not found`);
		}

		// If status is changing to archived, validate
		if (data.status === 'archived' && existing.status !== 'archived') {
			const canArchiveCheck = await this.canArchiveProject(id);
			if (!canArchiveCheck.valid) {
				throw new ValidationException(canArchiveCheck.errors);
			}
		}

		// Update project
		return this.projectRepository.update(id, data);
	}

	/**
	 * Move a project to a new parent
	 */
	async moveProject(projectId: number, newParentId: number | null): Promise<Project> {
		// Check if project exists
		const existing = await this.projectRepository.findById(projectId);
		if (!existing) {
			throw new Error(`Project with ID ${projectId} not found`);
		}

		// Check if new parent exists (if not null)
		if (newParentId !== null) {
			const newParent = await this.projectRepository.findById(newParentId);
			if (!newParent) {
				throw new Error(`Parent project with ID ${newParentId} not found`);
			}
		}

		// Validate move destination (prevent circular references)
		const ancestors = newParentId
			? await this.projectRepository.findAncestors(newParentId)
			: [];
		const ancestorIds = ancestors.map((a) => a.id);

		const moveCheck = ProjectBusinessRules.validateMoveDestination(
			projectId,
			newParentId,
			() => ancestorIds
		);

		if (!moveCheck.valid) {
			throw new ValidationException(moveCheck.errors);
		}

		// Validate depth after move
		if (newParentId !== null) {
			const depth = ancestors.length + 1;
			const depthCheck = ProjectBusinessRules.validateMaxDepth(depth);

			if (!depthCheck.valid) {
				throw new ValidationException(depthCheck.errors);
			}
		}

		// Perform move
		return this.projectRepository.move(projectId, newParentId);
	}

	/**
	 * Delete a project
	 */
	async deleteProject(id: number): Promise<boolean> {
		const exists = await this.projectRepository.exists(id);
		if (!exists) {
			throw new Error(`Project with ID ${id} not found`);
		}

		// Check if project has children
		const children = await this.projectRepository.findChildren(id);
		if (children.length > 0) {
			throw new Error('Cannot delete project with sub-projects. Delete or move them first.');
		}

		// Note: Tasks belonging to this project should be handled by database
		// constraints (CASCADE or RESTRICT) or checked here if needed
		// For now, we'll let the database handle it

		return this.projectRepository.delete(id);
	}

	/**
	 * Get project by ID
	 */
	async getProjectById(id: number): Promise<Project | null> {
		return this.projectRepository.findById(id);
	}

	/**
	 * Get all root projects (no parent)
	 */
	async getRootProjects(includeStats = false): Promise<Project[]> {
		return this.projectRepository.findRoots(includeStats);
	}

	/**
	 * Get children of a project
	 */
	async getProjectChildren(parentId: number, includeStats = false): Promise<Project[]> {
		return this.projectRepository.findChildren(parentId, includeStats);
	}

	/**
	 * Get all descendants of a project (recursive)
	 */
	async getProjectDescendants(projectId: number, maxDepth?: number): Promise<Project[]> {
		return this.projectRepository.findDescendants(projectId, maxDepth);
	}

	/**
	 * Get all ancestors of a project (parent chain)
	 */
	async getProjectAncestors(projectId: number): Promise<Project[]> {
		return this.projectRepository.findAncestors(projectId);
	}

	/**
	 * Get full project tree
	 */
	async getProjectTree(includeStats = false) {
		return this.projectRepository.getTree(includeStats);
	}

	/**
	 * Get projects by status
	 */
	async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
		return this.projectRepository.findAll({ status });
	}

	/**
	 * Search projects
	 */
	async searchProjects(searchQuery: string): Promise<Project[]> {
		return this.projectRepository.findAll({ search: searchQuery });
	}

	/**
	 * Archive a project
	 */
	async archiveProject(id: number): Promise<Project> {
		// Validate can archive
		const canArchiveCheck = await this.canArchiveProject(id);
		if (!canArchiveCheck.valid) {
			throw new ValidationException(canArchiveCheck.errors);
		}

		return this.updateProject(id, { status: 'archived' });
	}

	/**
	 * Complete a project (mark as done)
	 */
	async completeProject(id: number): Promise<Project> {
		return this.updateProject(id, { status: 'done' });
	}

	/**
	 * Get project statistics
	 */
	async getProjectStats(projectId: number) {
		return this.projectRepository.getStatsByProject(projectId);
	}

	/**
	 * Get aggregated statistics for multiple projects
	 */
	async getMultiProjectStats(projectIds: number[]) {
		const stats = await Promise.all(
			projectIds.map((id) => this.projectRepository.getStatsByProject(id))
		);

		return {
			totalProjects: projectIds.length,
			totalTasks: stats.reduce((sum, s) => sum + s.totalTasks, 0),
			totalCompleted: stats.reduce((sum, s) => sum + s.completedTasks, 0),
			totalInProgress: stats.reduce((sum, s) => sum + s.inProgressTasks, 0),
			totalTodo: stats.reduce((sum, s) => sum + s.todoTasks, 0),
			totalTimeSpent: stats.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0),
			averageCompletion:
				stats.length > 0
					? stats.reduce((sum, s) => sum + (s.completionRate || 0), 0) / stats.length
					: 0
		};
	}

	/**
	 * Get breadcrumb path for a project
	 */
	async getProjectBreadcrumb(projectId: number): Promise<Project[]> {
		const ancestors = await this.projectRepository.findAncestors(projectId);
		const current = await this.projectRepository.findById(projectId);

		if (!current) {
			throw new Error(`Project with ID ${projectId} not found`);
		}

		// Return in order: root -> ... -> parent -> current
		return [...ancestors, current];
	}

	/**
	 * Batch update projects
	 */
	async batchUpdateProjects(
		updates: Array<{ id: number; data: UpdateProjectDTO }>
	): Promise<Project[]> {
		const updatedProjects: Project[] = [];

		for (const { id, data } of updates) {
			try {
				const updated = await this.updateProject(id, data);
				updatedProjects.push(updated);
			} catch (error) {
				console.error(`Failed to update project ${id}:`, error);
				// Continue with other updates
			}
		}

		return updatedProjects;
	}

	/**
	 * Calculate project hierarchy depth
	 */
	async getProjectDepth(projectId: number): Promise<number> {
		const ancestors = await this.projectRepository.findAncestors(projectId);
		return ancestors.length;
	}

	/**
	 * Check if project can be archived
	 * @private
	 */
	private async canArchiveProject(projectId: number) {
		// Check if has active sub-projects
		const children = await this.projectRepository.findChildren(projectId);
		const hasActiveSubprojects = children.some((c) => c.status === 'active');

		// Check if has active tasks
		const stats = await this.projectRepository.getStatsByProject(projectId);
		const hasActiveTasks = stats.inProgressTasks > 0 || stats.todoTasks > 0;

		return ProjectBusinessRules.canArchive(hasActiveSubprojects, hasActiveTasks);
	}

	/**
	 * Get flattened list of all projects in tree order
	 */
	async getFlattenedTree(): Promise<Project[]> {
		const tree = await this.projectRepository.getTree();
		const flattened: Project[] = [];

		const flatten = (node: any) => {
			flattened.push(node);
			if (node.children) {
				for (const child of node.children) {
					flatten(child);
				}
			}
		};

		for (const root of tree.roots) {
			flatten(root);
		}

		return flattened;
	}

	/**
	 * Reactivate an archived project
	 */
	async reactivateProject(id: number): Promise<Project> {
		const existing = await this.projectRepository.findById(id);
		if (!existing) {
			throw new Error(`Project with ID ${id} not found`);
		}

		if (existing.status !== 'archived') {
			throw new Error('Only archived projects can be reactivated');
		}

		return this.updateProject(id, { status: 'active' });
	}

	/**
	 * Get project count by status
	 */
	async getProjectCountByStatus(): Promise<Record<ProjectStatus, number>> {
		const [active, done, archived] = await Promise.all([
			this.projectRepository.count({ status: 'active' }),
			this.projectRepository.count({ status: 'done' }),
			this.projectRepository.count({ status: 'archived' })
		]);

		return {
			active,
			done,
			archived
		};
	}
}
