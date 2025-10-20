/**
 * Project Repository Interface
 *
 * Defines project-specific data access operations including hierarchical features.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles project data access
 * - Interface Segregation: Focused on project operations
 * - Open/Closed: Easy to extend with new query methods
 */

import type { IBaseRepository } from './base.repository';
import type { Project, NewProject, ProjectStatus, ProjectWithDetails } from '$lib/types/database';

/**
 * Filter options for project queries
 */
export interface ProjectFilters {
  /** Filter by parent ID (null for root projects) */
  parentId?: number | null;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by public/private */
  isPublic?: boolean;
  /** Filter by status */
  status?: ProjectStatus;
  /** Search in name or description */
  search?: string;
  /** Filter by depth in hierarchy */
  depth?: number;
  /** Filter by creator */
  createdBy?: number;
}

/**
 * Data for updating a project
 */
export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
  status?: ProjectStatus;
  parentId?: number | null;
  isExpanded?: boolean;
}

/**
 * Project statistics
 */
export interface ProjectStats {
  /** Direct tasks (not including subprojects) */
  directTasks: number;
  directCompletedTasks: number;
  directInProgressTasks: number;
  directMinutes: number;
  /** Aggregated tasks (including all subprojects) */
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalMinutes: number;
  /** Subproject info */
  hasSubprojects: boolean;
  subprojectCount: number;
}

/**
 * Project repository interface with hierarchical operations
 */
export interface IProjectRepository extends IBaseRepository<Project, NewProject, UpdateProjectDTO, ProjectFilters> {
  /**
   * Find all root projects (no parent)
   * @param includeStats - Whether to include task statistics
   * @returns Promise resolving to root projects
   */
  findRoots(includeStats?: boolean): Promise<ProjectWithDetails[]>;

  /**
   * Find all children of a project
   * @param parentId - Parent project ID
   * @param includeStats - Whether to include task statistics
   * @returns Promise resolving to child projects
   */
  findChildren(parentId: number, includeStats?: boolean): Promise<ProjectWithDetails[]>;

  /**
   * Find all descendants of a project (recursive)
   * @param projectId - Project identifier
   * @param maxDepth - Maximum depth to traverse (0 = unlimited)
   * @returns Promise resolving to all descendant projects
   */
  findDescendants(projectId: number, maxDepth?: number): Promise<Project[]>;

  /**
   * Find all ancestors of a project (up the tree)
   * @param projectId - Project identifier
   * @returns Promise resolving to ancestor projects (ordered from root to parent)
   */
  findAncestors(projectId: number): Promise<Project[]>;

  /**
   * Find project with full details including stats
   * @param id - Project identifier
   * @returns Promise resolving to project with details or null
   */
  findByIdWithDetails(id: number): Promise<ProjectWithDetails | null>;

  /**
   * Get statistics for a project
   * @param id - Project identifier
   * @param includeDescendants - Whether to include descendant stats
   * @returns Promise resolving to project statistics
   */
  getStats(id: number, includeDescendants?: boolean): Promise<ProjectStats>;

  /**
   * Get statistics for multiple projects (batch operation)
   * @param ids - Array of project identifiers
   * @param includeDescendants - Whether to include descendant stats
   * @returns Promise resolving to map of project ID to stats
   */
  getBatchStats(ids: number[], includeDescendants?: boolean): Promise<Map<number, ProjectStats>>;

  /**
   * Move a project to a new parent
   * @param projectId - Project to move
   * @param newParentId - New parent ID (null for root)
   * @returns Promise resolving to updated project
   */
  move(projectId: number, newParentId: number | null): Promise<Project>;

  /**
   * Toggle project expansion state
   * @param projectId - Project identifier
   * @param isExpanded - New expansion state
   * @returns Promise resolving to updated project
   */
  setExpanded(projectId: number, isExpanded: boolean): Promise<Project>;

  /**
   * Get full project tree structure
   * @param includeStats - Whether to include statistics
   * @returns Promise resolving to hierarchical tree data
   */
  getTree(includeStats?: boolean): Promise<{
    roots: ProjectWithDetails[];
    flatMap: Map<number, ProjectWithDetails>;
  }>;

  /**
   * Find projects visible to a user (based on permissions)
   * @param userId - User identifier (null for anonymous)
   * @param filters - Optional additional filters
   * @returns Promise resolving to visible projects
   */
  findVisibleToUser(userId: number | null, filters?: ProjectFilters): Promise<Project[]>;

  /**
   * Archive a project and optionally its descendants
   * @param projectId - Project identifier
   * @param archiveDescendants - Whether to archive all child projects
   * @returns Promise resolving to number of archived projects
   */
  archive(projectId: number, archiveDescendants?: boolean): Promise<number>;
}
