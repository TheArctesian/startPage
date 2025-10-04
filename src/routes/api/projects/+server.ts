import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, tasks, timeSessions } from '$lib/server/db/schema';
import { eq, and, isNotNull, isNull, sql, or, inArray } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import { logUserActivity } from '$lib/server/auth';
import { getUserVisibleProjects, grantProjectPermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';
import type { NewProject, ProjectWithDetails } from '$lib/types/database';

export const GET: RequestHandler = async ({ url, locals, getClientAddress }) => {
  try {
    const includeStats = url.searchParams.get('stats') === 'true';
    const activeOnly = url.searchParams.get('active') !== 'false'; // Default to true
    const parentIdParam = url.searchParams.get('parentId');

    // Use the new permission system to get visible projects
    let projectList: any[] = [];
    
    if (locals.user?.role === 'admin') {
      // Admin sees all projects
      let query = db.select().from(projects);
      const conditions = [];
      
      if (activeOnly) {
        conditions.push(eq(projects.isActive, true));
      }

      // Filter by parentId if provided
      if (parentIdParam !== null) {
        if (parentIdParam === 'null' || parentIdParam === '') {
          conditions.push(isNull(projects.parentId));
        } else {
          const parentId = parseInt(parentIdParam);
          if (!isNaN(parentId)) {
            conditions.push(eq(projects.parentId, parentId));
          }
        }
      }

      // Apply conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      projectList = await query.orderBy(projects.depth, projects.name);
    } else {
      // Use permission-based filtering for non-admin users
      const userVisibleProjects = await getUserVisibleProjects(locals.user?.id ?? null);
      
      // Apply additional filters
      projectList = userVisibleProjects.filter(project => {
        if (activeOnly && !project.isActive) return false;
        
        if (parentIdParam !== null) {
          if (parentIdParam === 'null' || parentIdParam === '') {
            return project.parentId === null;
          } else {
            const parentId = parseInt(parentIdParam);
            return !isNaN(parentId) && project.parentId === parentId;
          }
        }
        
        return true;
      });

      // Sort by depth and name
      projectList.sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return a.name.localeCompare(b.name);
      });
    }

    if (!includeStats) {
      return json(projectList);
    }

    // Get stats for each project
    const projectsWithStats: ProjectWithDetails[] = await Promise.all(
      projectList.map(async (project) => {
        // Get task counts
        const allTasks = await db.select({ id: tasks.id, status: tasks.status })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(task => task.status === 'done').length;
        const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length;

        // Get total time spent
        const timeData = await db.select({ duration: timeSessions.duration })
          .from(timeSessions)
          .where(and(
            eq(timeSessions.projectId, project.id),
            isNotNull(timeSessions.duration)
          ));

        const totalMinutes = Math.round(
          timeData.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
        );

        return {
          ...project,
          totalTasks,
          completedTasks,
          inProgressTasks,
          totalMinutes
        };
      })
    );

    return json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  requireAuth(event);
  const { request, locals, getClientAddress } = event;
  
  try {
    const data: NewProject = await request.json();

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      return json(
        { error: 'Project name is required' }, 
        { status: 400 }
      );
    }

    if (data.name.length > 255) {
      return json(
        { error: 'Project name must be less than 255 characters' }, 
        { status: 400 }
      );
    }

    // Validate parent project exists if parentId is provided
    let parentProject = null;
    let depth = 0;
    let path = data.name.trim();

    if (data.parentId) {
      parentProject = await db.select()
        .from(projects)
        .where(eq(projects.id, data.parentId))
        .limit(1);

      if (parentProject.length === 0) {
        return json(
          { error: 'Parent project not found' }, 
          { status: 400 }
        );
      }

      depth = (parentProject[0].depth || 0) + 1;
      path = parentProject[0].path ? `${parentProject[0].path}/${data.name.trim()}` : data.name.trim();
    }

    // Set defaults with hierarchical fields
    const projectData: NewProject = {
      name: data.name.trim(),
      color: data.color || '--nord8',
      icon: data.icon,
      isActive: data.isActive ?? true,
      isPublic: data.isPublic ?? true, // Default to public
      parentId: data.parentId || null,
      createdBy: locals.user!.id,
      path: path,
      depth: depth,
      isExpanded: data.isExpanded ?? true
    };

    const [newProject] = await db.insert(projects)
      .values(projectData)
      .returning();

    // Grant project admin permission to the creator
    await grantProjectPermission(
      locals.user!.id,
      newProject.id,
      'project_admin',
      locals.user!.id
    );

    // Log activity
    await logUserActivity(
      locals.user!.id,
      'create',
      'project',
      newProject.id,
      getClientAddress(),
      { projectName: newProject.name }
    );

    return json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return json({ error: 'Failed to create project' }, { status: 500 });
  }
};