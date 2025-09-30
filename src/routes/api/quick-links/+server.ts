import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { quickLinks, projects } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { NewQuickLink } from '$lib/types/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project');
    const category = url.searchParams.get('category');

    let query = db.select().from(quickLinks);
    const conditions = [];

    // Apply filters
    if (projectId) {
      conditions.push(eq(quickLinks.projectId, parseInt(projectId)));
    }
    
    if (category) {
      conditions.push(eq(quickLinks.category, category as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const linkList = await query.orderBy(quickLinks.position, quickLinks.title);

    return json(linkList);
  } catch (error) {
    console.error('Error fetching quick links:', error);
    return json({ error: 'Failed to fetch quick links' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data: NewQuickLink = await request.json();

    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      return json({ error: 'Link title is required' }, { status: 400 });
    }

    if (data.title.length > 255) {
      return json({ error: 'Link title must be less than 255 characters' }, { status: 400 });
    }

    if (!data.url || data.url.trim().length === 0) {
      return json({ error: 'URL is required' }, { status: 400 });
    }

    if (!data.projectId) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project exists
    const [project] = await db.select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1);

    if (!project) {
      return json({ error: 'Project not found' }, { status: 404 });
    }

    // Basic URL validation
    try {
      new URL(data.url);
    } catch {
      return json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Get next position if not provided
    let position = data.position || 0;
    if (position === 0) {
      const [lastLink] = await db.select({ position: quickLinks.position })
        .from(quickLinks)
        .where(eq(quickLinks.projectId, data.projectId))
        .orderBy(desc(quickLinks.position))
        .limit(1);
      
      position = (lastLink?.position || 0) + 1;
    }

    const linkData: NewQuickLink = {
      title: data.title.trim(),
      url: data.url.trim(),
      projectId: data.projectId,
      icon: data.icon?.trim() || null,
      category: data.category || null,
      position
    };

    const [newLink] = await db.insert(quickLinks)
      .values(linkData)
      .returning();

    return json(newLink, { status: 201 });
  } catch (error) {
    console.error('Error creating quick link:', error);
    return json({ error: 'Failed to create quick link' }, { status: 500 });
  }
};