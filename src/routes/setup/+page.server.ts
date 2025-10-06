import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createUser } from '$lib/server/auth';
import { count, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  // Check if any users exist
  const [userCount] = await db.select({ count: count() }).from(users);
  
  return {
    hasUsers: userCount.count > 0,
    userCount: userCount.count
  };
};

export const actions: Actions = {
  createAdmin: async ({ request }) => {
    try {
      // Check if any users already exist
      const [userCount] = await db.select({ count: count() }).from(users);
      
      if (userCount.count > 0) {
        return fail(400, { error: 'Users already exist. Setup not needed.' });
      }

      const data = await request.formData();
      const username = data.get('username') as string;
      const password = data.get('password') as string;
      const email = data.get('email') as string;

      if (!username || !password) {
        return fail(400, { error: 'Username and password are required' });
      }

      // Create admin user
      const user = await createUser(username, password, email);
      
      // Update user to admin status and approved
      await db
        .update(users)
        .set({ 
          role: 'admin', 
          status: 'approved',
          projectAccess: '[]' // Admin has access to all projects anyway
        })
        .where(eq(users.id, user.id));

      return { success: true, message: 'Admin user created successfully' };
    } catch (error) {
      console.error('Setup error:', error);
      return fail(500, { error: 'Failed to create admin user' });
    }
  }
};