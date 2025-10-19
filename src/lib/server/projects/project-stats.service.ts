import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { inArray, sql } from 'drizzle-orm';
import type { TaskStatus } from '$lib/types/database';

export interface ProjectDirectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalMinutes: number;
}

type TaskLike = {
  status: TaskStatus;
  actualMinutes: number | null;
};

function normalizeNumericValue(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function withDefaultStats(stats: Partial<ProjectDirectStats> = {}): ProjectDirectStats {
  return {
    totalTasks: stats.totalTasks ?? 0,
    completedTasks: stats.completedTasks ?? 0,
    inProgressTasks: stats.inProgressTasks ?? 0,
    totalMinutes: stats.totalMinutes ?? 0
  };
}

type ProjectIdentifier = { id: number };

export class ProjectStatsService {
  constructor(private readonly database = db) {}

  async getDirectStats(projectsToCalculate: ProjectIdentifier[] | number[]): Promise<Map<number, ProjectDirectStats>> {
    const projectIds = Array.isArray(projectsToCalculate)
      ? projectsToCalculate.map((project) => (typeof project === 'number' ? project : project.id))
      : [];

    const filteredIds = projectIds
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

    const uniqueIds = Array.from(new Set(filteredIds));

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const results = await this.database
      .select({
        projectId: tasks.projectId,
        totalTasks: sql<number>`COUNT(*)`,
        completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
        inProgressTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        totalMinutes: sql<number>`COALESCE(SUM(${tasks.actualMinutes}), 0)`
      })
      .from(tasks)
      .where(inArray(tasks.projectId, uniqueIds))
      .groupBy(tasks.projectId);

    const statsMap = new Map<number, ProjectDirectStats>();

    for (const row of results) {
      if (row.projectId == null) continue;

      statsMap.set(row.projectId, withDefaultStats({
        totalTasks: normalizeNumericValue(row.totalTasks),
        completedTasks: normalizeNumericValue(row.completedTasks),
        inProgressTasks: normalizeNumericValue(row.inProgressTasks),
        totalMinutes: normalizeNumericValue(row.totalMinutes)
      }));
    }

    for (const id of uniqueIds) {
      if (!statsMap.has(id)) {
        statsMap.set(id, withDefaultStats());
      }
    }

    return statsMap;
  }

  getStatsForProject(projectId: number, statsMap: Map<number, ProjectDirectStats>): ProjectDirectStats {
    return statsMap.get(projectId) ?? withDefaultStats();
  }

  static fromTaskList(tasksForProject: TaskLike[]): ProjectDirectStats {
    return tasksForProject.reduce<ProjectDirectStats>(
      (acc, task) => {
        acc.totalTasks += 1;
        if (task.status === 'done') {
          acc.completedTasks += 1;
        }
        if (task.status === 'in_progress') {
          acc.inProgressTasks += 1;
        }
        acc.totalMinutes += task.actualMinutes ? task.actualMinutes : 0;
        return acc;
      },
      {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        totalMinutes: 0
      }
    );
  }
}
