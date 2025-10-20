import { db } from '../db';
import { authSessions } from '../db/schema';
import { eq, lt } from 'drizzle-orm';

export interface SessionRecord {
  id: string;
  userId: number | null;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
}

export interface SessionRepository {
  create(session: SessionRecord): Promise<void>;
  findById(id: string): Promise<SessionRecord | null>;
  delete(id: string): Promise<void>;
  deleteExpired(reference: Date): Promise<void>;
}

export class DbSessionRepository implements SessionRepository {
  constructor(private readonly client = db) {}

  async create(session: SessionRecord): Promise<void> {
    await this.client.insert(authSessions).values({
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null
    });
  }

  async findById(id: string): Promise<SessionRecord | null> {
    const [record] = await this.client
      .select({
        id: authSessions.id,
        userId: authSessions.userId,
        expiresAt: authSessions.expiresAt,
        ipAddress: authSessions.ipAddress,
        userAgent: authSessions.userAgent,
        createdAt: authSessions.createdAt
      })
      .from(authSessions)
      .where(eq(authSessions.id, id))
      .limit(1);

    return record ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(authSessions).where(eq(authSessions.id, id));
  }

  async deleteExpired(reference: Date): Promise<void> {
    await this.client.delete(authSessions).where(lt(authSessions.expiresAt, reference));
  }
}
