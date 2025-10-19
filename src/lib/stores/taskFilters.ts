import { writable, derived } from 'svelte/store';
import type { TaskStatus, Priority } from '$lib/types/database';

export type TaskStatusFilter = 'all' | TaskStatus;
export type TaskPriorityFilter = 'all' | Priority;

export interface TaskFilterState {
  search: string;
  status: TaskStatusFilter;
  priority: TaskPriorityFilter;
}

const defaultFilters: TaskFilterState = {
  search: '',
  status: 'all',
  priority: 'all'
};

function createTaskFilterStore() {
  const { subscribe, update, set } = writable<TaskFilterState>(defaultFilters);

  return {
    subscribe,
    setSearch(search: string) {
      update((filters) => ({
        ...filters,
        search
      }));
    },
    setStatus(status: TaskStatusFilter) {
      update((filters) => ({
        ...filters,
        status
      }));
    },
    setPriority(priority: TaskPriorityFilter) {
      update((filters) => ({
        ...filters,
        priority
      }));
    },
    reset() {
      set(defaultFilters);
    }
  };
}

export const taskFilters = createTaskFilterStore();

export const hasActiveTaskFilters = derived(taskFilters, ($filters) => {
  return (
    $filters.search.trim().length > 0 ||
    $filters.status !== 'all' ||
    $filters.priority !== 'all'
  );
});
