import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { gte, eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const days = parseInt(url.searchParams.get('days') || '7');
    const projectId = url.searchParams.get('project');

    // Calculate date range (last N days)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Build query conditions
    const conditions = [
      gte(tasks.completedAt, startDate),
      eq(tasks.status, 'done')
    ];

    if (projectId) {
      conditions.push(eq(tasks.projectId, parseInt(projectId)));
    }

    // Fetch completed tasks within date range
    const completedTasks = await db.select({
      id: tasks.id,
      completedAt: tasks.completedAt,
      actualMinutes: tasks.actualMinutes,
      status: tasks.status
    })
      .from(tasks)
      .where(and(...conditions));

    // Group by day
    const dailyData = new Map<string, { minutes: number; count: number }>();

    // Initialize all days in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData.set(dateKey, { minutes: 0, count: 0 });
    }

    // Aggregate task data
    completedTasks.forEach(task => {
      if (task.completedAt && task.status === 'done') {
        const dateKey = new Date(task.completedAt).toISOString().split('T')[0];
        const existing = dailyData.get(dateKey) || { minutes: 0, count: 0 };

        dailyData.set(dateKey, {
          minutes: existing.minutes + (task.actualMinutes || 0),
          count: existing.count + 1
        });
      }
    });

    // Convert to array and sort by date
    const result = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        minutes: data.minutes,
        tasksCompleted: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return json({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: result
    });
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    return json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
};
