import type { Task } from './database';

export interface ActiveTimer {
  id: string;
  task: Task | null;
  isRunning: boolean;
  startTime: Date;
  elapsedSeconds: number;
  pausedAt: Date | null;
  sessionId: number | null;
  projectId: number | null;
}

export interface TimerSession {
  id: number;
  taskId: number | null;
  projectId: number | null;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null; // in seconds
  isPaused: boolean;
  pausedDuration: number; // total time paused in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface TimerState {
  activeTimers: ActiveTimer[];
  selectedTimerId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ManualTimeEntry {
  taskId: number;
  projectId: number;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
}

export interface TimerEventPayload {
  timerId: string;
  action: 'start' | 'stop' | 'pause' | 'resume';
  timestamp: Date;
  taskId?: number;
  projectId?: number;
}

// Timer widget configuration
export interface TimerWidgetConfig {
  position: { x: number; y: number };
  isExpanded: boolean;
  autoHide: boolean;
  notifications: boolean;
  theme: 'auto' | 'light' | 'dark';
}

// Timer statistics
export interface TimerStats {
  totalTimeToday: number; // in seconds
  totalTimeWeek: number;
  totalTimeMonth: number;
  averageSessionLength: number;
  mostProductiveHour: number; // 0-23
  tasksCompleted: number;
  accuracy: number; // estimated vs actual time percentage
}

// Timer notification types
export interface TimerNotification {
  id: string;
  type: 'time_reached' | 'break_reminder' | 'session_complete';
  title: string;
  message: string;
  taskId?: number;
  timerId?: string;
  scheduledFor: Date;
  isShown: boolean;
}