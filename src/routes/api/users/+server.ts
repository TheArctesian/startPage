import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  requireAuth(event);
  const { locals } = event;
  
  try {
    // Only admin users can list all users
    if (locals.user!.role !== 'admin') {
      return json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all approved users (excluding passwords)
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.status, 'approved'))
      .orderBy(users.username);

    return json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
};