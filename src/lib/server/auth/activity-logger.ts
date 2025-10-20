import { db } from '../db';
import { userActivities } from '../db/schema';

export interface ActivityLogEntry {
  userId: number | null;
  action: string;
  resourceType?: string;
  resourceId?: number;
  ipAddress?: string;
  details?: object;
}

export interface ActivityLogger {
  log(entry: ActivityLogEntry): Promise<void>;
}

export class DbActivityLogger implements ActivityLogger {
  constructor(private readonly client = db) {}

  async log(entry: ActivityLogEntry): Promise<void> {
    await this.client.insert(userActivities).values({
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      details: entry.details ? JSON.stringify(entry.details) : null
    });
  }
}
