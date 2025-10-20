import { json } from '@sveltejs/kit';
import { quickLinkService } from '$lib/server/services';
import { ValidationException } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const linkId = parseInt(params.id);

    if (isNaN(linkId)) {
      return json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const link = await quickLinkService.getQuickLinkById(linkId);

    if (!link) {
      return json({ error: 'Quick link not found' }, { status: 404 });
    }

    return json(link);
  } catch (error) {
    console.error('Error fetching quick link:', error);
    return json({ error: 'Failed to fetch quick link' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const linkId = parseInt(params.id);

    if (isNaN(linkId)) {
      return json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const updates = await request.json();

    // Trim string fields
    if (updates.title) updates.title = updates.title.trim();
    if (updates.url) updates.url = updates.url.trim();

    // Use service layer for update with validation
    const updatedLink = await quickLinkService.updateQuickLink(linkId, updates);

    return json(updatedLink);
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }

    console.error('Error updating quick link:', error);
    return json({ error: 'Failed to update quick link' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const linkId = parseInt(params.id);

    if (isNaN(linkId)) {
      return json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const success = await quickLinkService.deleteQuickLink(linkId);

    if (!success) {
      return json({ error: 'Quick link not found' }, { status: 404 });
    }

    return json({ message: 'Quick link deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }

    console.error('Error deleting quick link:', error);
    return json({ error: 'Failed to delete quick link' }, { status: 500 });
  }
};