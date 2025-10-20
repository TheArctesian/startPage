/**
 * Drizzle QuickLink Repository Implementation
 *
 * Concrete implementation of IQuickLinkRepository using Drizzle ORM.
 */

import { eq, and, or, desc, ilike, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IQuickLinkRepository,
  QuickLinkFilters,
  UpdateQuickLinkDTO,
  QuickLinkStats
} from '../interfaces/quicklink.repository';
import type { QuickLink, NewQuickLink, LinkCategory } from '$lib/types/database';
import { quickLinks } from '$lib/server/db/schema';

export class DrizzleQuickLinkRepository implements IQuickLinkRepository {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Find all quick links matching filters
   */
  async findAll(filters?: QuickLinkFilters): Promise<QuickLink[]> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select().from(quickLinks);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(quickLinks.createdAt));
    return results as QuickLink[];
  }

  /**
   * Find quick link by ID
   */
  async findById(id: number): Promise<QuickLink | null> {
    const results = await this.db
      .select()
      .from(quickLinks)
      .where(eq(quickLinks.id, id))
      .limit(1);

    return results[0] as QuickLink || null;
  }

  /**
   * Find one quick link matching filters
   */
  async findOne(filters: Partial<QuickLinkFilters>): Promise<QuickLink | null> {
    const conditions = this.buildFilterConditions(filters);

    if (conditions.length === 0) {
      return null;
    }

    const results = await this.db
      .select()
      .from(quickLinks)
      .where(and(...conditions))
      .limit(1);

    return results[0] as QuickLink || null;
  }

  /**
   * Create a new quick link
   */
  async create(data: NewQuickLink): Promise<QuickLink> {
    const results = await this.db
      .insert(quickLinks)
      .values(data)
      .returning();

    return results[0] as QuickLink;
  }

  /**
   * Update a quick link
   */
  async update(id: number, data: UpdateQuickLinkDTO): Promise<QuickLink> {
    const results = await this.db
      .update(quickLinks)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(eq(quickLinks.id, id))
      .returning();

    if (!results[0]) {
      throw new Error(`QuickLink with ID ${id} not found`);
    }

    return results[0] as QuickLink;
  }

  /**
   * Delete a quick link
   */
  async delete(id: number): Promise<boolean> {
    const results = await this.db
      .delete(quickLinks)
      .where(eq(quickLinks.id, id))
      .returning();

    return results.length > 0;
  }

  /**
   * Count quick links matching filters
   */
  async count(filters?: QuickLinkFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select({ count: quickLinks.id }).from(quickLinks);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;
    return results.length;
  }

  /**
   * Check if quick link exists
   */
  async exists(id: number): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  /**
   * Find quick links by project
   */
  async findByProject(projectId: number, category?: LinkCategory): Promise<QuickLink[]> {
    const conditions = [eq(quickLinks.projectId, projectId)];

    if (category) {
      conditions.push(eq(quickLinks.category, category));
    }

    const results = await this.db
      .select()
      .from(quickLinks)
      .where(and(...conditions))
      .orderBy(desc(quickLinks.createdAt));

    return results as QuickLink[];
  }

  /**
   * Find quick links by category
   */
  async findByCategory(category: LinkCategory, userId?: number): Promise<QuickLink[]> {
    // TODO: Add user permission filtering when implemented
    const results = await this.db
      .select()
      .from(quickLinks)
      .where(eq(quickLinks.category, category))
      .orderBy(desc(quickLinks.createdAt));

    return results as QuickLink[];
  }

  /**
   * Get statistics for project's quick links
   */
  async getStatsByProject(projectId: number): Promise<QuickLinkStats> {
    const links = await this.findByProject(projectId);

    const byCategory: Record<LinkCategory, number> = {
      docs: 0,
      tools: 0,
      resources: 0,
      other: 0
    };

    for (const link of links) {
      if (link.category && link.category in byCategory) {
        byCategory[link.category as LinkCategory]++;
      }
    }

    return {
      total: links.length,
      byCategory
    };
  }

  /**
   * Reorder quick links within a project
   */
  async reorder(linkIds: number[], projectId: number): Promise<boolean> {
    // Verify all links belong to the project
    const links = await this.db
      .select()
      .from(quickLinks)
      .where(
        and(
          inArray(quickLinks.id, linkIds),
          eq(quickLinks.projectId, projectId)
        )
      );

    if (links.length !== linkIds.length) {
      return false; // Some links don't belong to this project
    }

    // Update positions (if we add a position field to schema)
    // For now, this is a no-op as the schema doesn't have a position field
    // TODO: Add position field to quickLinks schema
    return true;
  }

  /**
   * Duplicate a quick link to another project
   */
  async duplicate(linkId: number, targetProjectId: number): Promise<QuickLink> {
    const original = await this.findById(linkId);
    if (!original) {
      throw new Error(`QuickLink ${linkId} not found`);
    }

    const newLink: NewQuickLink = {
      title: original.title,
      url: original.url,
      icon: original.icon,
      category: original.category,
      projectId: targetProjectId,
      createdBy: original.createdBy
    };

    return this.create(newLink);
  }

  /**
   * Bulk create quick links
   */
  async bulkCreate(
    links: Omit<NewQuickLink, 'projectId'>[],
    projectId: number
  ): Promise<QuickLink[]> {
    const linksWithProject = links.map(link => ({
      ...link,
      projectId
    }));

    const results = await this.db
      .insert(quickLinks)
      .values(linksWithProject)
      .returning();

    return results as QuickLink[];
  }

  /**
   * Delete all quick links for a project
   */
  async deleteByProject(projectId: number): Promise<number> {
    const results = await this.db
      .delete(quickLinks)
      .where(eq(quickLinks.projectId, projectId))
      .returning();

    return results.length;
  }

  /**
   * Build filter conditions
   * @private
   */
  private buildFilterConditions(filters?: QuickLinkFilters): any[] {
    if (!filters) return [];

    const conditions = [];

    if (filters.projectId !== undefined) {
      conditions.push(eq(quickLinks.projectId, filters.projectId));
    }

    if (filters.category) {
      conditions.push(eq(quickLinks.category, filters.category));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(quickLinks.title, `%${filters.search}%`),
          ilike(quickLinks.url, `%${filters.search}%`)
        )
      );
    }

    if (filters.createdBy !== undefined) {
      conditions.push(eq(quickLinks.createdBy, filters.createdBy));
    }

    return conditions;
  }
}
