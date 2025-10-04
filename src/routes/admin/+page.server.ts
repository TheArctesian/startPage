import { db } from '$lib/server/db';
import { users, projects, projectUsers } from '$lib/server/db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);
  const { locals } = event;

  // Only admin users can access the admin panel
  if (locals.user!.role !== 'admin') {
    throw redirect(303, '/');
  }

  try {
    // Get all users with counts
    const [allUsers, userStats, projectStats] = await Promise.all([
      // Get all users with their details
      db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt
      })
      .from(users)
      .orderBy(users.createdAt),

      // Get user statistics
      db.select({
        total: count(),
        status: users.status
      })
      .from(users)
      .groupBy(users.status),

      // Get project statistics
      db.select({
        total: count(),
        isPublic: projects.isPublic
      })
      .from(projects)
      .groupBy(projects.isPublic)
    ]);

    // Get project permissions count
    const permissionStats = await db.select({
      total: count()
    })
    .from(projectUsers);

    return {
      users: allUsers,
      stats: {
        users: userStats,
        projects: projectStats,
        permissions: permissionStats[0]?.total || 0
      }
    };
  } catch (error) {
    console.error('Error loading admin data:', error);
    throw redirect(303, '/');
  }
};