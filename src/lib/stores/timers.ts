import { writable, derived, get } from 'svelte/store';
import type { 
  ActiveTimer, 
  TimerState, 
  TimerEventPayload, 
  ManualTimeEntry,
  TimerWidgetConfig 
} from '$lib/types/timer';
import type { Task } from '$lib/types/database';

// Core timer state
export const timerState = writable<TimerState>({
  activeTimers: [],
  selectedTimerId: null,
  isLoading: false,
  error: null
});

// Widget configuration
export const widgetConfig = writable<TimerWidgetConfig>({
  position: { x: 20, y: 20 },
  isExpanded: false,
  autoHide: false,
  notifications: true,
  theme: 'auto'
});

// Derived stores
export const activeTimers = derived(timerState, $state => $state.activeTimers);
export const selectedTimerId = derived(timerState, $state => $state.selectedTimerId);
export const isTimerLoading = derived(timerState, $state => $state.isLoading);
export const timerError = derived(timerState, $state => $state.error);

export const hasActiveTimers = derived(activeTimers, $timers => $timers.length > 0);
export const runningTimers = derived(activeTimers, $timers => 
  $timers.filter(t => t.isRunning && !t.pausedAt)
);
export const pausedTimers = derived(activeTimers, $timers => 
  $timers.filter(t => t.pausedAt !== null)
);

export const selectedTimer = derived(
  [activeTimers, selectedTimerId],
  ([$timers, $selectedId]) => {
    if (!$selectedId) return $timers[0] || null;
    return $timers.find(t => t.id === $selectedId) || null;
  }
);

// Legacy compatibility with existing timer stores
export const isTimerRunning = derived(runningTimers, $running => $running.length > 0);
export const selectedTask = derived(selectedTimer, $timer => $timer?.task || null);

// Timer management functions
export class TimerManager {
  
  /**
   * Start a new timer for a task
   */
  static async startTimer(task: Task): Promise<string> {
    const current = get(timerState);
    
    // Check if task already has an active timer
    const existingTimer = current.activeTimers.find(t => t.task?.id === task.id);
    if (existingTimer) {
      // Resume existing timer if paused, or just select it
      if (existingTimer.pausedAt) {
        return this.resumeTimer(existingTimer.id);
      } else {
        this.selectTimer(existingTimer.id);
        return existingTimer.id;
      }
    }

    timerState.update(state => ({ ...state, isLoading: true, error: null }));

    try {
      // Create new timer session in database
      const response = await fetch('/api/time-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          projectId: task.projectId,
          startTime: new Date().toISOString(),
          isActive: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start timer session');
      }

      const session = await response.json();
      const timerId = `timer_${session.id}_${Date.now()}`;

      // Create new active timer
      const newTimer: ActiveTimer = {
        id: timerId,
        task,
        isRunning: true,
        startTime: new Date(),
        elapsedSeconds: 0,
        pausedAt: null,
        sessionId: session.id,
        projectId: task.projectId
      };

      // Update task status to in_progress (async, don't block timer start)
      this.updateTaskStatus(task.id, 'in_progress');

      timerState.update(state => ({
        ...state,
        activeTimers: [...state.activeTimers, newTimer],
        selectedTimerId: timerId,
        isLoading: false
      }));

      // Save state to localStorage for persistence
      this.saveTimersToStorage();

      return timerId;
    } catch (error) {
      timerState.update(state => ({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  /**
   * Stop a timer and save the session
   */
  static async stopTimer(timerId: string): Promise<void> {
    const current = get(timerState);
    const timer = current.activeTimers.find(t => t.id === timerId);
    
    if (!timer) {
      throw new Error('Timer not found');
    }

    timerState.update(state => ({ ...state, isLoading: true }));

    try {
      // Calculate final duration
      const now = new Date();
      const totalElapsed = timer.pausedAt 
        ? timer.elapsedSeconds
        : timer.elapsedSeconds + Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);

      // Update session in database
      if (timer.sessionId) {
        const response = await fetch(`/api/time-sessions/${timer.sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endTime: now.toISOString(),
            duration: totalElapsed,
            isActive: false
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save timer session');
        }
      }

      // Remove timer from active list
      timerState.update(state => {
        const remainingTimers = state.activeTimers.filter(t => t.id !== timerId);
        return {
          ...state,
          activeTimers: remainingTimers,
          selectedTimerId: state.selectedTimerId === timerId 
            ? (remainingTimers[0]?.id || null)
            : state.selectedTimerId,
          isLoading: false
        };
      });

      this.saveTimersToStorage();

      // Emit timer stop event for analytics
      this.emitTimerEvent({
        timerId,
        action: 'stop',
        timestamp: now,
        taskId: timer.task?.id,
        projectId: timer.projectId || undefined
      });

    } catch (error) {
      timerState.update(state => ({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  /**
   * Pause a running timer
   */
  static pauseTimer(timerId: string): void {
    const current = get(timerState);
    const timer = current.activeTimers.find(t => t.id === timerId);
    
    if (!timer || !timer.isRunning || timer.pausedAt) {
      return;
    }

    const now = new Date();
    const additionalElapsed = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);

    timerState.update(state => ({
      ...state,
      activeTimers: state.activeTimers.map(t => 
        t.id === timerId 
          ? { 
              ...t, 
              pausedAt: now, 
              elapsedSeconds: t.elapsedSeconds + additionalElapsed 
            }
          : t
      )
    }));

    this.saveTimersToStorage();
    this.emitTimerEvent({
      timerId,
      action: 'pause',
      timestamp: now,
      taskId: timer.task?.id,
      projectId: timer.projectId || undefined
    });
  }

  /**
   * Resume a paused timer
   */
  static resumeTimer(timerId: string): string {
    const current = get(timerState);
    const timer = current.activeTimers.find(t => t.id === timerId);
    
    if (!timer || !timer.pausedAt) {
      return timerId;
    }

    const now = new Date();

    timerState.update(state => ({
      ...state,
      activeTimers: state.activeTimers.map(t => 
        t.id === timerId 
          ? { 
              ...t, 
              pausedAt: null, 
              startTime: now 
            }
          : t
      ),
      selectedTimerId: timerId
    }));

    this.saveTimersToStorage();
    this.emitTimerEvent({
      timerId,
      action: 'resume',
      timestamp: now,
      taskId: timer.task?.id,
      projectId: timer.projectId || undefined
    });

    return timerId;
  }

  /**
   * Select a timer as the active one
   */
  static selectTimer(timerId: string): void {
    timerState.update(state => ({
      ...state,
      selectedTimerId: timerId
    }));
    this.saveTimersToStorage();
  }

  /**
   * Add manual time entry
   */
  static async addManualTime(entry: ManualTimeEntry): Promise<void> {
    try {
      const response = await fetch('/api/time-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: entry.taskId,
          projectId: entry.projectId,
          description: entry.description,
          startTime: entry.startTime.toISOString(),
          endTime: entry.endTime.toISOString(),
          duration: entry.duration,
          isManual: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add manual time entry');
      }
    } catch (error) {
      timerState.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  /**
   * Load active timers from database and storage on app start
   */
  static async loadActiveTimers(): Promise<void> {
    try {
      timerState.update(state => ({ ...state, isLoading: true, error: null }));

      // First, try to load from database
      const response = await fetch('/api/time-sessions?active=true&details=true');
      
      if (response.ok) {
        const activeSessions = await response.json();
        const activeTimers: ActiveTimer[] = [];

        // Convert database sessions to active timers
        for (const session of activeSessions) {
          if (session.task) {
            const timer: ActiveTimer = {
              id: `timer_${session.id}_${session.taskId}`,
              task: session.task,
              isRunning: true,
              startTime: new Date(session.startTime),
              elapsedSeconds: 0, // Will be calculated
              pausedAt: null, // Database doesn't track pause state yet
              sessionId: session.id,
              projectId: session.projectId
            };
            activeTimers.push(timer);
          }
        }

        if (activeTimers.length > 0) {
          timerState.update(state => ({
            ...state,
            activeTimers,
            selectedTimerId: activeTimers[0].id,
            isLoading: false
          }));
          
          // Save to localStorage as backup
          this.saveTimersToStorage();
          return;
        }
      }

      // Fallback to localStorage if no database timers
      this.loadTimersFromStorage();
      
    } catch (error) {
      console.warn('Failed to load active timers from database, falling back to localStorage:', error);
      this.loadTimersFromStorage();
    } finally {
      timerState.update(state => ({ ...state, isLoading: false }));
    }
  }

  /**
   * Load timers from localStorage (fallback)
   */
  private static loadTimersFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('active-timers');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Validate and restore timers
        const restoredTimers: ActiveTimer[] = data.timers
          ?.filter((t: any) => t && t.id && t.startTime)
          ?.map((t: any) => ({
            ...t,
            startTime: new Date(t.startTime),
            pausedAt: t.pausedAt ? new Date(t.pausedAt) : null
          })) || [];

        if (restoredTimers.length > 0) {
          timerState.update(state => ({
            ...state,
            activeTimers: restoredTimers,
            selectedTimerId: data.selectedTimerId || restoredTimers[0]?.id || null
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load timers from storage:', error);
    }
  }

  /**
   * Save current timers to localStorage
   */
  static saveTimersToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const current = get(timerState);
      const data = {
        timers: current.activeTimers,
        selectedTimerId: current.selectedTimerId,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('active-timers', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save timers to storage:', error);
    }
  }

  /**
   * Update task status when timer actions occur
   */
  private static async updateTaskStatus(taskId: number, status: string): Promise<void> {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        console.warn('Failed to update task status');
      }
    } catch (error) {
      console.warn('Failed to update task status:', error);
    }
  }

  /**
   * Emit timer events for analytics and external listeners
   */
  private static emitTimerEvent(payload: TimerEventPayload): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('timer-event', { detail: payload }));
    }
  }

  /**
   * Clear all active timers (for testing/reset)
   */
  static clearAllTimers(): void {
    timerState.update(state => ({
      ...state,
      activeTimers: [],
      selectedTimerId: null
    }));
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active-timers');
    }
  }

  /**
   * Get timer statistics
   */
  static getTimerStats(): { totalElapsed: number; runningCount: number; pausedCount: number } {
    const current = get(timerState);
    const now = new Date();
    
    let totalElapsed = 0;
    let runningCount = 0;
    let pausedCount = 0;

    current.activeTimers.forEach(timer => {
      if (timer.pausedAt) {
        pausedCount++;
        totalElapsed += timer.elapsedSeconds;
      } else if (timer.isRunning) {
        runningCount++;
        const elapsed = timer.elapsedSeconds + Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
        totalElapsed += elapsed;
      }
    });

    return { totalElapsed, runningCount, pausedCount };
  }
}

// Initialize timer store on module load
if (typeof window !== 'undefined') {
  TimerManager.loadActiveTimers();
}

// Export timer actions for backward compatibility
export const startTimer = TimerManager.startTimer;
export const stopTimer = TimerManager.stopTimer;
export const pauseTimer = TimerManager.pauseTimer;
export const resumeTimer = TimerManager.resumeTimer;
export const selectTimer = TimerManager.selectTimer;