/**
 * QuickLink Repository Interface
 *
 * Defines quick link data access operations.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles quick link data access
 * - Interface Segregation: Focused interface for quick link operations
 * - Dependency Inversion: Abstracts database implementation
 */

import type { IBaseRepository } from './base.repository';
import type { QuickLink, NewQuickLink, LinkCategory } from '$lib/types/database';

/**
 * Filter options for quick link queries
 */
export interface QuickLinkFilters {
  /** Filter by project ID */
  projectId?: number;
  /** Filter by category */
  category?: LinkCategory;
  /** Search in title or URL */
  search?: string;
  /** Filter by creator */
  createdBy?: number;
}

/**
 * Data for updating a quick link
 */
export interface UpdateQuickLinkDTO {
  title?: string;
  url?: string;
  icon?: string | null;
  category?: LinkCategory;
  projectId?: number;
}

/**
 * QuickLink statistics for a project
 */
export interface QuickLinkStats {
  total: number;
  byCategory: Record<LinkCategory, number>;
}

/**
 * Quick link repository interface
 */
export interface IQuickLinkRepository extends IBaseRepository<QuickLink, NewQuickLink, UpdateQuickLinkDTO, QuickLinkFilters> {
  /**
   * Find all quick links for a project
   * @param projectId - Project identifier
   * @param category - Optional category filter
   * @returns Promise resolving to quick links
   */
  findByProject(projectId: number, category?: LinkCategory): Promise<QuickLink[]>;

  /**
   * Find quick links by category across all projects
   * @param category - Link category
   * @param userId - Optional user filter (for permission checks)
   * @returns Promise resolving to quick links
   */
  findByCategory(category: LinkCategory, userId?: number): Promise<QuickLink[]>;

  /**
   * Get statistics for project's quick links
   * @param projectId - Project identifier
   * @returns Promise resolving to statistics
   */
  getStatsByProject(projectId: number): Promise<QuickLinkStats>;

  /**
   * Reorder quick links within a project
   * @param linkIds - Array of link IDs in new order
   * @param projectId - Project identifier
   * @returns Promise resolving to success boolean
   */
  reorder(linkIds: number[], projectId: number): Promise<boolean>;

  /**
   * Duplicate a quick link to another project
   * @param linkId - Link to duplicate
   * @param targetProjectId - Destination project
   * @returns Promise resolving to new link
   */
  duplicate(linkId: number, targetProjectId: number): Promise<QuickLink>;

  /**
   * Bulk create quick links for a project
   * @param links - Array of link data
   * @param projectId - Project identifier
   * @returns Promise resolving to created links
   */
  bulkCreate(links: Omit<NewQuickLink, 'projectId'>[], projectId: number): Promise<QuickLink[]>;

  /**
   * Delete all quick links for a project
   * @param projectId - Project identifier
   * @returns Promise resolving to number of deleted links
   */
  deleteByProject(projectId: number): Promise<number>;
}
