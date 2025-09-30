import { writable, derived, readable } from 'svelte/store';
import type { 
  Project, 
  Task, 
  TimeSession, 
  QuickLink, 
  TimerState,
  ProjectWithDetails,
  TaskWithDetails,
  ProjectTreeData 
} from '$lib/types/database';

// Core data stores
export const projects = writable<Project[]>([]);
export const tasks = writable<Task[]>([]);
export const timeSessions = writable<TimeSession[]>([]);
export const quickLinks = writable<QuickLink[]>([]);

// Active selections
export const activeProject = writable<Project | null>(null);
export const selectedTask = writable<Task | null>(null);

// Timer state
export const timerState = writable<TimerState>({
  isRunning: false,
  elapsedSeconds: 0
});

// UI state
export const isLoading = writable<boolean>(false);
export const loadingTasks = writable<boolean>(false);
export const loadingQuickLinks = writable<boolean>(false);
export const loadingSubProjects = writable<boolean>(false);
export const error = writable<string | null>(null);

// Tree-specific stores
export const projectTreeData = writable<ProjectTreeData | null>(null);

// Derived stores
export const activeProjectTasks = derived(
  [tasks, activeProject],
  ([$tasks, $activeProject]) => {
    console.log('🔍 activeProjectTasks filtering:');
    console.log('  - activeProject:', $activeProject?.name, 'ID:', $activeProject?.id, 'Type:', typeof $activeProject?.id);
    console.log('  - tasks count:', $tasks.length);
    
    if (!$activeProject) {
      console.log('  - No active project, returning empty array');
      return [];
    }
    
    const filtered = $tasks.filter(task => {
      const strictMatches = task.projectId === $activeProject.id;
      const looseMatches = task.projectId == $activeProject.id;
      console.log(`  - Task "${task.title}" projectId:`, task.projectId, 'Type:', typeof task.projectId);
      console.log(`    Strict (===): ${strictMatches}, Loose (==): ${looseMatches}`);
      return looseMatches; // Use loose equality to handle type mismatches
    });
    
    console.log('  - Filtered tasks:', filtered.length);
    return filtered;
  }
);

export const activeProjectQuickLinks = derived(
  [quickLinks, activeProject],
  ([$quickLinks, $activeProject]) => {
    if (!$activeProject) return [];
    return $quickLinks.filter(link => link.projectId === $activeProject.id);
  }
);

export const todoTasks = derived(
  activeProjectTasks,
  ($tasks) => $tasks.filter(task => task.status === 'todo')
);

export const inProgressTasks = derived(
  activeProjectTasks,
  ($tasks) => $tasks.filter(task => task.status === 'in_progress')
);

export const doneTasks = derived(
  activeProjectTasks,
  ($tasks) => $tasks.filter(task => task.status === 'done')
);

export const currentTimer = derived(
  [timerState, selectedTask],
  ([$timerState, $selectedTask]) => ({
    ...$timerState,
    task: $selectedTask
  })
);

// Timer helpers
export const isTimerRunning = derived(
  timerState,
  ($timerState) => $timerState.isRunning
);

export const timerDisplay = derived(
  timerState,
  ($timerState) => {
    const seconds = $timerState.elapsedSeconds;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
);

// Project statistics
export const projectStats = derived(
  [projects, tasks, timeSessions],
  ([$projects, $tasks, $timeSessions]) => {
    return $projects.map(project => {
      const projectTasks = $tasks.filter(t => t.projectId === project.id);
      const projectSessions = $timeSessions.filter(s => s.projectId === project.id);
      
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'done').length;
      const totalMinutes = Math.round(
        projectSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
      );
      
      return {
        ...project,
        totalTasks,
        completedTasks,
        totalMinutes,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      } as ProjectWithDetails;
    });
  }
);

// Export store actions for external use
export * from './actions';
export * from './persistence';