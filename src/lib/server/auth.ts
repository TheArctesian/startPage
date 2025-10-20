import { db } from './db';
import { AuthService } from './auth/auth-service';
import {
  PBKDF2PasswordHasher,
  defaultPasswordHasherConfig
} from './auth/password-hasher';
import { DbUserRepository } from './auth/user-repository';
import { DbSessionRepository } from './auth/session-repository';
import { DbActivityLogger } from './auth/activity-logger';
import { CryptoSessionIdGenerator } from './auth/session-id-generator';
import { hasProjectAccess, canUserEdit } from './auth/access-control';

const authService = new AuthService({
  userRepository: new DbUserRepository(db),
  passwordHasher: new PBKDF2PasswordHasher(defaultPasswordHasherConfig),
  sessionRepository: new DbSessionRepository(db),
  activityLogger: new DbActivityLogger(db),
  sessionIdGenerator: new CryptoSessionIdGenerator(32)
});

export { AuthService } from './auth/auth-service';
export type { SessionValidationResult } from './auth/auth-service';
export { hasProjectAccess, canUserEdit } from './auth/access-control';
export { authService };

export const hashPassword = (password: string) => authService.hashPassword(password);

export const verifyPassword = (password: string, stored: string) =>
  authService.verifyPassword(password, stored);

export const createUser = (username: string, password: string, email?: string) =>
  authService.createUser(username, password, email);

export const authenticateUser = (username: string, password: string) =>
  authService.authenticateUser(username, password);

export const getUserById = (userId: number) => authService.getUserById(userId);

export const createSession = (userId?: number, ipAddress?: string, userAgent?: string) =>
  authService.createSession({ userId, ipAddress, userAgent });

export const validateSession = (sessionId: string) => authService.validateSession(sessionId);

export const deleteSession = (sessionId: string) => authService.deleteSession(sessionId);

export const cleanupExpiredSessions = () => authService.cleanupExpiredSessions();

export const logUserActivity = (
  userId: number | null,
  action: string,
  resourceType?: string,
  resourceId?: number,
  ipAddress?: string,
  details?: object
) =>
  authService.logUserActivity({
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress,
    details
  });
