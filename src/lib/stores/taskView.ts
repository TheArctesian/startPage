import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type TaskViewMode = 'kanban' | 'grid' | 'list';

// Default view mode
const DEFAULT_VIEW_MODE: TaskViewMode = 'kanban';
const STORAGE_KEY = 'task-view-mode';

// Create the store
function createTaskViewStore() {
  // Initialize from localStorage if available
  let initialValue = DEFAULT_VIEW_MODE;
  
  if (browser) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['kanban', 'grid', 'list'].includes(stored)) {
        initialValue = stored as TaskViewMode;
      }
    } catch (error) {
      console.warn('Failed to load task view mode from localStorage:', error);
    }
  }

  const { subscribe, set } = writable<TaskViewMode>(initialValue);

  return {
    subscribe,
    set: (value: TaskViewMode) => {
      set(value);
      
      // Persist to localStorage
      if (browser) {
        try {
          localStorage.setItem(STORAGE_KEY, value);
        } catch (error) {
          console.warn('Failed to save task view mode to localStorage:', error);
        }
      }
    },
    setKanban: () => set('kanban'),
    setGrid: () => set('grid'),
    setList: () => set('list'),
    reset: () => set(DEFAULT_VIEW_MODE)
  };
}

export const taskViewMode = createTaskViewStore();

// Derived stores for convenience
import { derived } from 'svelte/store';

export const isKanbanView = derived(taskViewMode, $mode => $mode === 'kanban');
export const isGridView = derived(taskViewMode, $mode => $mode === 'grid');
export const isListView = derived(taskViewMode, $mode => $mode === 'list');