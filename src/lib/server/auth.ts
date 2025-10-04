import { pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './db';
import { authSessions, users, userActivities } from './db/schema';
import { eq, lt, and } from 'drizzle-orm';

const pbkdf2Async = promisify(pbkdf2);

// Configuration
const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha256';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString('hex');
  const hash = await pbkdf2Async(password, salt, ITERATIONS, KEYLEN, DIGEST);
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  
  const newHash = await pbkdf2Async(password, salt, ITERATIONS, KEYLEN, DIGEST);
  return hash === newHash.toString('hex');
}

// User management utilities
export async function createUser(username: string, password: string, email?: string): Promise<{ id: number; username: string; status: string }> {
  // Check if username already exists
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({
      username: username.trim(),
      passwordHash: hashedPassword,
      email: email?.trim() || null
    })
    .returning({ id: users.id, username: users.username, status: users.status });

  return newUser;
}

export async function authenticateUser(username: string, password: string): Promise<{ id: number; username: string; role: string; status: string; projectAccess: string } | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      role: users.role,
      status: users.status,
      projectAccess: users.projectAccess
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update last login time
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    projectAccess: user.projectAccess
  };
}

export async function getUserById(userId: number): Promise<{ id: number; username: string; role: string; status: string; projectAccess: string } | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      status: users.status,
      projectAccess: users.projectAccess
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

// Session management
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId?: number, ipAddress?: string, userAgent?: string): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await db.insert(authSessions).values({
    id: sessionId,
    userId: userId || null, // null for anonymous sessions
    ipAddress,
    userAgent,
    expiresAt
  });
  
  return sessionId;
}

export async function validateSession(sessionId: string): Promise<{ userId?: number; isAnonymous: boolean } | null> {
  if (!sessionId) return null;
  
  const [session] = await db
    .select({
      id: authSessions.id,
      userId: authSessions.userId,
      expiresAt: authSessions.expiresAt
    })
    .from(authSessions)
    .where(eq(authSessions.id, sessionId))
    .limit(1);
  
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await deleteSession(sessionId);
    }
    return null;
  }
  
  return {
    userId: session.userId || undefined,
    isAnonymous: !session.userId
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(authSessions).where(eq(authSessions.id, sessionId));
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(authSessions).where(lt(authSessions.expiresAt, new Date()));
}

// Activity logging
export async function logUserActivity(
  userId: number | null,
  action: string,
  resourceType?: string,
  resourceId?: number,
  ipAddress?: string,
  details?: object
): Promise<void> {
  await db.insert(userActivities).values({
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress,
    details: details ? JSON.stringify(details) : null
  });
}

// Permission checking utilities
export function hasProjectAccess(user: { role: string; projectAccess: string } | null, projectId: number): boolean {
  // Anonymous users can only see public projects (handled elsewhere)
  if (!user) return false;
  
  // Admin has access to all projects
  if (user.role === 'admin') return true;
  
  // Check if user has specific access to this project
  try {
    const accessList = JSON.parse(user.projectAccess) as number[];
    return accessList.includes(projectId);
  } catch {
    return false;
  }
}

export function canUserEdit(user: { role: string; status: string; projectAccess: string } | null, projectId: number): boolean {
  if (!user || user.status !== 'approved') return false;
  return hasProjectAccess(user, projectId);
}