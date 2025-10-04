import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import { logUserActivity } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async (event) => {
  requireAuth(event);
  const { params, request, locals, getClientAddress } = event;
  
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Only admin users can modify other users
    if (locals.user!.role !== 'admin') {
      return json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updates = await request.json();
    
    // Validate the updates
    if (updates.status && !['approved', 'pending', 'rejected'].includes(updates.status)) {
      return json({ error: 'Invalid status' }, { status: 400 });
    }
    
    if (updates.role && !['admin', 'member'].includes(updates.role)) {
      return json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (updates.role === 'member' && userId === locals.user!.id) {
      return json({ error: 'Cannot demote yourself' }, { status: 400 });
    }

    // Get current user data for logging
    const [currentUser] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    const [updatedUser] = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Log admin activity
    await logUserActivity(
      locals.user!.id,
      'admin_update_user',
      'user',
      userId,
      getClientAddress(),
      { 
        targetUser: currentUser.username,
        changes: Object.keys(updates),
        oldValues: Object.keys(updates).reduce((acc, key) => {
          acc[key] = currentUser[key as keyof typeof currentUser];
          return acc;
        }, {} as any),
        newValues: updates
      }
    );

    return json({ 
      message: 'User updated successfully', 
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return json({ error: 'Failed to update user' }, { status: 500 });
  }
};