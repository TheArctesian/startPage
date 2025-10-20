/**
 * Drizzle Project Repository Implementation
 *
 * Concrete implementation of IProjectRepository with hierarchical support.
 * Handles complex tree operations and aggregated statistics.
 */

import { eq, and, or, desc, asc, isNull, ilike, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IProjectRepository,
  ProjectFilters,
  UpdateProjectDTO,
  ProjectStats
} from '../interfaces/project.repository';
import type { Project, NewProject, ProjectWithDetails } from '$lib/types/database';
import { projects, tasks } from '$lib/server/db/schema';

export class DrizzleProjectRepository implements IProjectRepository {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Find all projects matching filters
   */
  async findAll(filters?: ProjectFilters): Promise<Project[]> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select().from(projects);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(projects.depth, projects.name);
    return results as Project[];
  }

  /**
   * Find project by ID
   */
  async findById(id: number): Promise<Project | null> {
    const results = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    return results[0] as Project || null;
  }

  /**
   * Find one project matching filters
   */
  async findOne(filters: Partial<ProjectFilters>): Promise<Project | null> {
    const conditions = this.buildFilterConditions(filters);

    if (conditions.length === 0) {
      return null;
    }

    const results = await this.db
      .select()
      .from(projects)
      .where(and(...conditions))
      .limit(1);

    return results[0] as Project || null;
  }

  /**
   * Create a new project
   */
  async create(data: NewProject): Promise<Project> {
    // Calculate depth and path if parent exists
    let depth = 0;
    let path = data.name;

    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (parent) {
        depth = (parent.depth || 0) + 1;
        path = parent.path ? `${parent.path}/${data.name}` : data.name;
      }
    }

    const projectData = {
      ...data,
      depth,
      path
    };

    const results = await this.db
      .insert(projects)
      .values(projectData)
      .returning();

    return results[0] as Project;
  }

  /**
   * Update a project
   */
  async update(id: number, data: UpdateProjectDTO): Promise<Project> {
    const results = await this.db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(eq(projects.id, id))
      .returning();

    if (!results[0]) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // If name changed, update paths of all descendants
    if (data.name) {
      await this.updateDescendantPaths(id);
    }

    return results[0] as Project;
  }

  /**
   * Delete a project
   */
  async delete(id: number): Promise<boolean> {
    const results = await this.db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    return results.length > 0;
  }

  /**
   * Count projects matching filters
   */
  async count(filters?: ProjectFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select({ count: projects.id }).from(projects);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;
    return results.length;
  }

  /**
   * Check if project exists
   */
  async exists(id: number): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  /**
   * Find root projects
   */
  async findRoots(includeStats = false): Promise<ProjectWithDetails[]> {
    const rootProjects = await this.db
      .select()
      .from(projects)
      .where(isNull(projects.parentId))
      .orderBy(projects.name);

    if (!includeStats) {
      return rootProjects as ProjectWithDetails[];
    }

    return this.enrichWithStats(rootProjects as Project[]);
  }

  /**
   * Find children of a project
   */
  async findChildren(parentId: number, includeStats = false): Promise<ProjectWithDetails[]> {
    const children = await this.db
      .select()
      .from(projects)
      .where(eq(projects.parentId, parentId))
      .orderBy(projects.name);

    if (!includeStats) {
      return children as ProjectWithDetails[];
    }

    return this.enrichWithStats(children as Project[]);
  }

  /**
   * Find all descendants recursively
   */
  async findDescendants(projectId: number, maxDepth = 0): Promise<Project[]> {
    const project = await this.findById(projectId);
    if (!project) return [];

    const projectDepth = project.depth || 0;
    const descendants: Project[] = [];
    const toProcess = [projectId];
    const processed = new Set<number>();

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      if (processed.has(currentId)) continue;
      processed.add(currentId);

      const children = await this.db
        .select()
        .from(projects)
        .where(eq(projects.parentId, currentId));

      for (const child of children) {
        const childDepth = (child.depth || 0) - projectDepth;
        if (maxDepth === 0 || childDepth <= maxDepth) {
          descendants.push(child as Project);
          toProcess.push(child.id);
        }
      }
    }

    return descendants;
  }

  /**
   * Find all ancestors up the tree
   */
  async findAncestors(projectId: number): Promise<Project[]> {
    const ancestors: Project[] = [];
    let currentId = projectId;

    while (currentId) {
      const project = await this.findById(currentId);
      if (!project || !project.parentId) break;

      const parent = await this.findById(project.parentId);
      if (!parent) break;

      ancestors.unshift(parent); // Add to beginning for root-to-parent order
      currentId = parent.parentId || 0;
    }

    return ancestors;
  }

  /**
   * Find project with full details
   */
  async findByIdWithDetails(id: number): Promise<ProjectWithDetails | null> {
    const project = await this.findById(id);
    if (!project) return null;

    const enriched = await this.enrichWithStats([project]);
    return enriched[0] || null;
  }

  /**
   * Get statistics for a project
   */
  async getStats(id: number, includeDescendants = false): Promise<ProjectStats> {
    // Get direct task stats
    const directTasks = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, id));

    const directStats = this.calculateTaskStats(directTasks);

    if (!includeDescendants) {
      return {
        ...directStats,
        totalTasks: directStats.directTasks,
        completedTasks: directStats.directCompletedTasks,
        inProgressTasks: directStats.directInProgressTasks,
        totalMinutes: directStats.directMinutes,
        hasSubprojects: false,
        subprojectCount: 0
      };
    }

    // Get descendant projects
    const descendants = await this.findDescendants(id);
    const descendantIds = descendants.map(d => d.id);

    // Get all tasks from descendants
    let descendantTasks: any[] = [];
    if (descendantIds.length > 0) {
      descendantTasks = await this.db
        .select()
        .from(tasks)
        .where(inArray(tasks.projectId, descendantIds));
    }

    const descendantStats = this.calculateTaskStats(descendantTasks);

    return {
      ...directStats,
      totalTasks: directStats.directTasks + descendantStats.directTasks,
      completedTasks: directStats.directCompletedTasks + descendantStats.directCompletedTasks,
      inProgressTasks: directStats.directInProgressTasks + descendantStats.directInProgressTasks,
      totalMinutes: directStats.directMinutes + descendantStats.directMinutes,
      hasSubprojects: descendants.length > 0,
      subprojectCount: descendants.length
    };
  }

  /**
   * Get batch statistics for multiple projects
   */
  async getBatchStats(ids: number[], includeDescendants = false): Promise<Map<number, ProjectStats>> {
    const statsMap = new Map<number, ProjectStats>();

    // Could be optimized with a single query, but for clarity we'll iterate
    for (const id of ids) {
      const stats = await this.getStats(id, includeDescendants);
      statsMap.set(id, stats);
    }

    return statsMap;
  }

  /**
   * Move project to new parent
   */
  async move(projectId: number, newParentId: number | null): Promise<Project> {
    const project = await this.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Calculate new depth and path
    let newDepth = 0;
    let newPath = project.name;

    if (newParentId) {
      const newParent = await this.findById(newParentId);
      if (!newParent) {
        throw new Error(`Parent project ${newParentId} not found`);
      }

      newDepth = (newParent.depth || 0) + 1;
      newPath = newParent.path ? `${newParent.path}/${project.name}` : project.name;
    }

    // Update project
    await this.update(projectId, {
      parentId: newParentId,
    });

    // Update depth and path for this project and all descendants
    await this.updateDescendantPaths(projectId);

    return this.findById(projectId) as Promise<Project>;
  }

  /**
   * Set project expansion state
   */
  async setExpanded(projectId: number, isExpanded: boolean): Promise<Project> {
    return this.update(projectId, { isExpanded });
  }

  /**
   * Get full project tree
   */
  async getTree(includeStats = false): Promise<{
    roots: ProjectWithDetails[];
    flatMap: Map<number, ProjectWithDetails>;
  }> {
    // Get all projects
    const allProjects = await this.findAll();

    // Enrich with stats if requested
    const enrichedProjects = includeStats
      ? await this.enrichWithStats(allProjects)
      : allProjects as ProjectWithDetails[];

    // Build flat map
    const flatMap = new Map<number, ProjectWithDetails>();
    for (const project of enrichedProjects) {
      flatMap.set(project.id, project);
    }

    // Find roots
    const roots = enrichedProjects.filter(p => !p.parentId);

    return { roots, flatMap };
  }

  /**
   * Find projects visible to user (stub - implement with permissions)
   */
  async findVisibleToUser(userId: number | null, filters?: ProjectFilters): Promise<Project[]> {
    // For now, return all active projects
    // TODO: Implement actual permission checking
    return this.findAll({
      ...filters,
      isActive: true
    });
  }

  /**
   * Archive project and optionally descendants
   */
  async archive(projectId: number, archiveDescendants = false): Promise<number> {
    let count = 0;

    // Archive the project
    await this.update(projectId, { status: 'archived' });
    count++;

    if (archiveDescendants) {
      const descendants = await this.findDescendants(projectId);
      for (const descendant of descendants) {
        await this.update(descendant.id, { status: 'archived' });
        count++;
      }
    }

    return count;
  }

  /**
   * Enrich projects with statistics
   * @private
   */
  private async enrichWithStats(projectList: Project[]): Promise<ProjectWithDetails[]> {
    const enriched: ProjectWithDetails[] = [];

    for (const project of projectList) {
      const stats = await this.getStats(project.id, true);

      enriched.push({
        ...project,
        directTasks: stats.directTasks,
        directCompletedTasks: stats.directCompletedTasks,
        directInProgressTasks: stats.directInProgressTasks,
        directMinutes: stats.directMinutes,
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        inProgressTasks: stats.inProgressTasks,
        totalMinutes: stats.totalMinutes,
        hasSubprojects: stats.hasSubprojects
      });
    }

    return enriched;
  }

  /**
   * Calculate task statistics from task list
   * @private
   */
  private calculateTaskStats(taskList: any[]): {
    directTasks: number;
    directCompletedTasks: number;
    directInProgressTasks: number;
    directMinutes: number;
  } {
    const stats = {
      directTasks: taskList.length,
      directCompletedTasks: 0,
      directInProgressTasks: 0,
      directMinutes: 0
    };

    for (const task of taskList) {
      if (task.status === 'done') {
        stats.directCompletedTasks++;
      } else if (task.status === 'in_progress') {
        stats.directInProgressTasks++;
      }

      if (task.actualMinutes) {
        stats.directMinutes += task.actualMinutes;
      }
    }

    return stats;
  }

  /**
   * Update paths for all descendants after a name or parent change
   * @private
   */
  private async updateDescendantPaths(projectId: number): Promise<void> {
    const project = await this.findById(projectId);
    if (!project) return;

    const descendants = await this.findDescendants(projectId);

    for (const descendant of descendants) {
      const ancestors = await this.findAncestors(descendant.id);
      const pathParts = [...ancestors.map(a => a.name), descendant.name];
      const newPath = pathParts.join('/');
      const newDepth = ancestors.length;

      await this.db
        .update(projects)
        .set({
          path: newPath,
          depth: newDepth
        })
        .where(eq(projects.id, descendant.id));
    }
  }

  /**
   * Build filter conditions
   * @private
   */
  private buildFilterConditions(filters?: ProjectFilters): any[] {
    if (!filters) return [];

    const conditions = [];

    if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        conditions.push(isNull(projects.parentId));
      } else {
        conditions.push(eq(projects.parentId, filters.parentId));
      }
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(projects.isActive, filters.isActive));
    }

    if (filters.isPublic !== undefined) {
      conditions.push(eq(projects.isPublic, filters.isPublic));
    }

    if (filters.status) {
      conditions.push(eq(projects.status, filters.status));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(projects.name, `%${filters.search}%`),
          ilike(projects.description, `%${filters.search}%`)
        )
      );
    }

    if (filters.depth !== undefined) {
      conditions.push(eq(projects.depth, filters.depth));
    }

    if (filters.createdBy !== undefined) {
      conditions.push(eq(projects.createdBy, filters.createdBy));
    }

    return conditions;
  }
}
