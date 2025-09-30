import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { quickLinks } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const linkId = parseInt(params.id);

    if (isNaN(linkId)) {
      return json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const [link] = await db.select()
      .from(quickLinks)
      .where(eq(quickLinks.id, linkId))
      .limit(1);

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

    // Validate updates
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim().length === 0) {
        return json({ error: 'Link title cannot be empty' }, { status: 400 });
      }
      if (updates.title.length > 255) {
        return json({ error: 'Link title must be less than 255 characters' }, { status: 400 });
      }
      updates.title = updates.title.trim();
    }

    if (updates.url !== undefined) {
      if (!updates.url || updates.url.trim().length === 0) {
        return json({ error: 'URL cannot be empty' }, { status: 400 });
      }
      
      // Basic URL validation
      try {
        new URL(updates.url);
      } catch {
        return json({ error: 'Invalid URL format' }, { status: 400 });
      }
      
      updates.url = updates.url.trim();
    }

    if (updates.icon !== undefined && updates.icon) {
      updates.icon = updates.icon.trim();
    }

    const [updatedLink] = await db.update(quickLinks)
      .set(updates)
      .where(eq(quickLinks.id, linkId))
      .returning();

    if (!updatedLink) {
      return json({ error: 'Quick link not found' }, { status: 404 });
    }

    return json(updatedLink);
  } catch (error) {
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

    const [deletedLink] = await db.delete(quickLinks)
      .where(eq(quickLinks.id, linkId))
      .returning();

    if (!deletedLink) {
      return json({ error: 'Quick link not found' }, { status: 404 });
    }

    return json({ message: 'Quick link deleted successfully', link: deletedLink });
  } catch (error) {
    console.error('Error deleting quick link:', error);
    return json({ error: 'Failed to delete quick link' }, { status: 500 });
  }
};