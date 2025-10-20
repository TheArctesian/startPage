import { json } from '@sveltejs/kit';
import { quickLinkService } from '$lib/server/services';
import { ValidationException } from '$lib/server/validation';
import { requireAuth } from '$lib/server/auth-guard';
import type { RequestHandler } from './$types';
import type { NewQuickLink, LinkCategory } from '$lib/types/database';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project');
    const category = url.searchParams.get('category');

    // Use service layer for filtering
    let linkList;

    if (category && projectId) {
      linkList = await quickLinkService.getQuickLinksByCategory(
        category as LinkCategory,
        parseInt(projectId)
      );
    } else if (category) {
      linkList = await quickLinkService.getQuickLinksByCategory(category as LinkCategory);
    } else if (projectId) {
      linkList = await quickLinkService.getQuickLinksByProject(parseInt(projectId));
    } else {
      const result = await quickLinkService.getAllQuickLinks();
      linkList = result.items;
    }

    return json(linkList);
  } catch (error) {
    console.error('Error fetching quick links:', error);
    return json({ error: 'Failed to fetch quick links' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  requireAuth(event);
  const { request } = event;

  try {
    const data: NewQuickLink = await request.json();

    // Set defaults
    const linkData: NewQuickLink = {
      ...data,
      title: data.title?.trim(),
      url: data.url?.trim(),
      category: data.category || null,
      position: data.position || 0
    };

    // Use service layer for creation with validation
    const newLink = await quickLinkService.createQuickLink(linkData);

    return json(newLink, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }

    console.error('Error creating quick link:', error);
    return json({ error: 'Failed to create quick link' }, { status: 500 });
  }
};