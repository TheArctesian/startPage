import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { PublicUser } from '$lib/types/database';

export interface CreateUserData {
  username: string;
  passwordHash: string;
  email?: string | null;
}

export interface UserWithPassword {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  status: string;
  projectAccess: string;
  email: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  findByUsername(username: string): Promise<UserWithPassword | null>;
  findById(userId: number): Promise<PublicUser | null>;
  createUser(data: CreateUserData): Promise<PublicUser>;
  updateLastLogin(userId: number, date: Date): Promise<void>;
}

export class DbUserRepository implements UserRepository {
  constructor(private readonly client = db) {}

  async findByUsername(username: string): Promise<UserWithPassword | null> {
    const [user] = await this.client
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
        role: users.role,
        status: users.status,
        projectAccess: users.projectAccess,
        email: users.email,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user ?? null;
  }

  async findById(userId: number): Promise<PublicUser | null> {
    const [user] = await this.client
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        status: users.status,
        projectAccess: users.projectAccess,
        email: users.email,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }

  async createUser(data: CreateUserData): Promise<PublicUser> {
    const [user] = await this.client
      .insert(users)
      .values({
        username: data.username,
        passwordHash: data.passwordHash,
        email: data.email ?? null
      })
      .returning({
        id: users.id,
        username: users.username,
        role: users.role,
        status: users.status,
        projectAccess: users.projectAccess,
        email: users.email,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    return user;
  }

  async updateLastLogin(userId: number, date: Date): Promise<void> {
    await this.client.update(users).set({ lastLoginAt: date }).where(eq(users.id, userId));
  }
}
