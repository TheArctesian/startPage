import type { User } from '$lib/types/database';

type AccessSubject = Pick<User, 'role' | 'projectAccess'>;
type AccessSubjectWithStatus = Pick<User, 'role' | 'projectAccess' | 'status'>;

function parseProjectAccess(projectAccess: string): number[] {
  try {
    const parsed = JSON.parse(projectAccess) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => {
          if (typeof value === 'number') {
            return value;
          }
          if (typeof value === 'string') {
            const coerced = Number(value);
            return Number.isNaN(coerced) ? null : coerced;
          }
          return null;
        })
        .filter((value): value is number => value !== null);
    }
  } catch (error) {
    console.warn('Failed to parse projectAccess', error);
  }
  return [];
}

export function hasProjectAccess(user: AccessSubject | null, projectId: number): boolean {
  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const accessibleProjects = parseProjectAccess(user.projectAccess || '[]');
  return accessibleProjects.includes(projectId);
}

export function canUserEdit(user: AccessSubjectWithStatus | null, projectId: number): boolean {
  if (!user || user.status !== 'approved') {
    return false;
  }

  return hasProjectAccess(user, projectId);
}
