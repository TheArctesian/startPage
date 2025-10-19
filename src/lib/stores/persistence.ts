// Local storage persistence following UNIX philosophy: simple, focused functions
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { activeProject } from './index';
import type { Project } from '$lib/types/database';

const STORAGE_KEYS = {
  ACTIVE_PROJECT: 'productivity_active_project',
  PREFERENCES: 'productivity_preferences'
} as const;

// Generic storage helpers
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!browser) return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (!browser) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

function removeFromStorage(key: string): void {
  if (!browser) return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove ${key} from localStorage:`, error);
  }
}

// Active project persistence
export function saveActiveProject(project: Project | null): void {
  if (project) {
    saveToStorage(STORAGE_KEYS.ACTIVE_PROJECT, {
      id: project.id,
      name: project.name,
      color: project.color,
      icon: project.icon
    });
  } else {
    removeFromStorage(STORAGE_KEYS.ACTIVE_PROJECT);
  }
}

export function loadActiveProject(): Project | null {
  return getFromStorage<Project | null>(STORAGE_KEYS.ACTIVE_PROJECT, null);
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  defaultEstimatedMinutes: number;
  autoStartTimer: boolean;
  showEstimationAccuracy: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  soundEnabled: true,
  defaultEstimatedMinutes: 30,
  autoStartTimer: false,
  showEstimationAccuracy: true
};

export function savePreferences(preferences: Partial<UserPreferences>): void {
  const current = loadPreferences();
  const updated = { ...current, ...preferences };
  saveToStorage(STORAGE_KEYS.PREFERENCES, updated);
}

export function loadPreferences(): UserPreferences {
  return getFromStorage(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
}

// Auto-save subscriptions
export function initializePersistence(): void {
  if (!browser) return;

  // Save active project when it changes
  activeProject.subscribe(project => {
    saveActiveProject(project);
  });
}

// Restore state on app initialization
export function restorePersistedState(): void {
  if (!browser) return;

  // Restore active project
  const savedProject = loadActiveProject();
  if (savedProject) {
    activeProject.set(savedProject);
  }
}

// Clear all persisted data (for logout/reset)
export function clearPersistedData(): void {
  if (!browser) return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromStorage(key);
  });
}