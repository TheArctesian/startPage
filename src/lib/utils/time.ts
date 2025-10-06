import type { TaskWithDetails } from '$lib/types/database';

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function calculateTimeSpent(task: TaskWithDetails): number {
  if (!task.timeSessions) return 0;
  return Math.round(
    task.timeSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
  );
}

export function calculateTimeProgress(task: TaskWithDetails): number {
  const spent = calculateTimeSpent(task);
  if (!task.estimatedMinutes || spent === 0) return 0;
  return Math.min((spent / task.estimatedMinutes) * 100, 100);
}

export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

export function parseTimeInput(input: string): number {
  const timeRegex = /(\d+)\s*([hm]?)/gi;
  let totalMinutes = 0;
  let match;

  while ((match = timeRegex.exec(input)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2]?.toLowerCase() || 'm';
    
    if (unit === 'h') {
      totalMinutes += value * 60;
    } else {
      totalMinutes += value;
    }
  }

  return totalMinutes || 0;
}