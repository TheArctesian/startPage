import type { PasswordHasher } from './password-hasher';
import type { SessionRepository, SessionRecord } from './session-repository';
import type { SessionIdGenerator } from './session-id-generator';
import type { ActivityLogger } from './activity-logger';
import type { UserRepository } from './user-repository';
import type { PublicUser } from '$lib/types/database';

export interface SessionValidationResult {
  userId?: number;
  isAnonymous: boolean;
}

export interface CreateSessionOptions {
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface LogActivityOptions {
  userId: number | null;
  action: string;
  resourceType?: string;
  resourceId?: number;
  ipAddress?: string;
  details?: object;
}

interface AuthServiceDependencies {
  userRepository: UserRepository;
  passwordHasher: PasswordHasher;
  sessionRepository: SessionRepository;
  activityLogger: ActivityLogger;
  sessionIdGenerator: SessionIdGenerator;
  sessionDurationMs?: number;
  clock?: () => Date;
}

const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly sessionRepository: SessionRepository;
  private readonly activityLogger: ActivityLogger;
  private readonly sessionIdGenerator: SessionIdGenerator;
  private readonly sessionDurationMs: number;
  private readonly clock: () => Date;

  constructor(dependencies: AuthServiceDependencies) {
    this.userRepository = dependencies.userRepository;
    this.passwordHasher = dependencies.passwordHasher;
    this.sessionRepository = dependencies.sessionRepository;
    this.activityLogger = dependencies.activityLogger;
    this.sessionIdGenerator = dependencies.sessionIdGenerator;
    this.sessionDurationMs = dependencies.sessionDurationMs ?? DEFAULT_SESSION_DURATION_MS;
    this.clock = dependencies.clock ?? (() => new Date());
  }

  async hashPassword(password: string): Promise<string> {
    return this.passwordHasher.hash(password);
  }

  async verifyPassword(password: string, stored: string): Promise<boolean> {
    return this.passwordHasher.verify(password, stored);
  }

  async createUser(username: string, password: string, email?: string): Promise<PublicUser> {
    const trimmedUsername = username.trim();
    const existing = await this.userRepository.findByUsername(trimmedUsername);
    if (existing) {
      throw new Error('Username already exists');
    }

    const passwordHash = await this.hashPassword(password);
    return this.userRepository.createUser({
      username: trimmedUsername,
      passwordHash,
      email: email?.trim() || null
    });
  }

  async authenticateUser(
    username: string,
    password: string
  ): Promise<PublicUser | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    await this.userRepository.updateLastLogin(user.id, this.clock());

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as 'admin' | 'member',
      status: user.status as 'pending' | 'approved' | 'suspended',
      projectAccess: user.projectAccess,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async getUserById(userId: number): Promise<PublicUser | null> {
    return this.userRepository.findById(userId);
  }

  async createSession(options: CreateSessionOptions = {}): Promise<string> {
    const sessionId = this.sessionIdGenerator.generate();
    const expiresAt = new Date(this.clock().getTime() + this.sessionDurationMs);

    const sessionRecord: SessionRecord = {
      id: sessionId,
      userId: options.userId ?? null,
      expiresAt,
      ipAddress: options.ipAddress ?? null,
      userAgent: options.userAgent ?? null
    };

    await this.sessionRepository.create(sessionRecord);
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<SessionValidationResult | null> {
    if (!sessionId) {
      return null;
    }

    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return null;
    }

    const now = this.clock();
    if (session.expiresAt < now) {
      await this.sessionRepository.delete(sessionId);
      return null;
    }

    return {
      userId: session.userId ?? undefined,
      isAnonymous: session.userId === null
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const reference = this.clock();
    await this.sessionRepository.deleteExpired(reference);
  }

  async logUserActivity(options: LogActivityOptions): Promise<void> {
    await this.activityLogger.log({
      userId: options.userId,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      ipAddress: options.ipAddress,
      details: options.details
    });
  }
}
