<script lang="ts">
  import Icon from '$lib/ui/icon.svelte';
  import { taskViewMode, isKanbanView, isGridView, isListView } from '$lib/stores/taskView';
  import {
    taskFilters,
    hasActiveTaskFilters,
    type TaskStatusFilter,
    type TaskPriorityFilter
  } from '$lib/stores/taskFilters';

  export let canEdit = false;
  export let onNewTask: (() => void) | undefined = undefined;

  const statusOptions: Array<{ label: string; value: TaskStatusFilter; icon: string }> = [
    { label: 'All', value: 'all', icon: 'layers' },
    { label: 'To Do', value: 'todo', icon: 'circle-empty' },
    { label: 'In Progress', value: 'in_progress', icon: 'circle-progress' },
    { label: 'Done', value: 'done', icon: 'circle-check' }
  ];

  const priorityOptions: Array<{ label: string; value: TaskPriorityFilter }> = [
    { label: 'All priorities', value: 'all' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' }
  ];

  function setView(mode: 'kanban' | 'grid' | 'list') {
    taskViewMode.set(mode);
  }

  function setStatusFilter(value: TaskStatusFilter) {
    taskFilters.setStatus(value);
  }

  function setPriorityFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value as TaskPriorityFilter;
    taskFilters.setPriority(value);
  }

  function handleSearch(event: Event) {
    taskFilters.setSearch((event.target as HTMLInputElement).value);
  }

  function resetFilters() {
    taskFilters.reset();
  }
</script>

<div class="task-toolbar">
  <div class="toolbar-primary">
    <div class="view-toggle-group" role="tablist" aria-label="Task view modes">
      <button
        type="button"
        class="view-toggle tooltip-trigger"
        class:active={$isKanbanView}
        data-tooltip="Column-based workflow"
        aria-pressed={$isKanbanView}
        on:click={() => setView('kanban')}
      >
        <Icon name="columns" size={16} />
        <span>Kanban</span>
      </button>
      <button
        type="button"
        class="view-toggle tooltip-trigger"
        class:active={$isGridView}
        data-tooltip="Organize tasks in tiles"
        aria-pressed={$isGridView}
        on:click={() => setView('grid')}
      >
        <Icon name="grid" size={16} />
        <span>Grid</span>
      </button>
      <button
        type="button"
        class="view-toggle tooltip-trigger"
        class:active={$isListView}
        data-tooltip="Compact list view"
        aria-pressed={$isListView}
        on:click={() => setView('list')}
      >
        <Icon name="list" size={16} />
        <span>List</span>
      </button>
    </div>

    <div class="primary-search">
      <label for="task-search-filter-primary" class="visually-hidden">Search tasks</label>
      <div class="search-input-wrapper">
        <Icon name="search" size={14} />
        <input
          id="task-search-filter-primary"
          type="search"
          placeholder="Search tasks"
          value={$taskFilters.search}
          on:input={handleSearch}
        />
      </div>
    </div>
  </div>

  <div class="toolbar-filters" role="group" aria-label="Task filters">
    <div class="status-filter" role="radiogroup" aria-label="Filter by status">
      {#each statusOptions as option}
        <button
          type="button"
          class="status-chip"
          class:active={$taskFilters.status === option.value}
          on:click={() => setStatusFilter(option.value)}
          aria-pressed={$taskFilters.status === option.value}
        >
          <Icon name={option.icon} size={14} />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>

    <div class="priority-filter">
      <label for="task-priority-filter" class="visually-hidden">Filter by priority</label>
      <select
        id="task-priority-filter"
        class="priority-select"
        on:change={setPriorityFilter}
        bind:value={$taskFilters.priority}
      >
        {#each priorityOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    {#if $hasActiveTaskFilters}
      <button
        type="button"
        class="clear-filters-btn"
        on:click={resetFilters}
      >
        Clear
      </button>
    {/if}

    {#if canEdit && onNewTask}
      <button
        type="button"
        class="add-task-btn tooltip-trigger"
        data-tooltip="Create a task"
        on:click={onNewTask}
      >
        <span class="plus-icon">+</span>
        <span>Add Task</span>
      </button>
    {/if}
  </div>
</div>

<style>
  .task-toolbar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: rgba(59, 66, 82, 0.9);
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(94, 129, 172, 0.25);
    backdrop-filter: blur(6px);
    width: 100%;
    box-sizing: border-box;
  }

  .toolbar-primary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .view-toggle-group {
    display: inline-flex;
    gap: 0.4rem;
    padding: 0.25rem;
    border-radius: 999px;
    background: rgba(46, 52, 64, 0.8);
    border: 1px solid rgba(94, 129, 172, 0.2);
  }

  .view-toggle {
    border: none;
    background: transparent;
    color: var(--nord5);
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-toggle.active {
    background: var(--nord8);
    color: var(--nord0);
    box-shadow: 0 4px 12px rgba(136, 192, 208, 0.35);
  }

  .view-toggle:not(.active):hover {
    background: rgba(94, 129, 172, 0.2);
    color: var(--nord6);
  }

  .tooltip-trigger {
    position: relative;
  }

  .tooltip-trigger::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 50%;
    transform: translateX(-50%) translateY(-0.25rem);
    background: rgba(45, 52, 64, 0.95);
    color: var(--nord6);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 10;
  }

  .tooltip-trigger:hover::after,
  .tooltip-trigger:focus-visible::after {
    opacity: 1;
    transform: translateX(-50%);
  }

  .primary-search {
    flex: 1 1 260px;
  }

  .primary-search .search-input-wrapper {
    width: 100%;
  }

  .add-task-btn {
    border: none;
    background: var(--nord8);
    color: var(--nord0);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.9rem;
    border-radius: 0.65rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    white-space: nowrap;
  }

  .add-task-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(136, 192, 208, 0.25);
  }

  .plus-icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  .toolbar-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .status-filter {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.25rem;
    border-radius: 999px;
    background: rgba(46, 52, 64, 0.6);
    border: 1px solid rgba(76, 86, 106, 0.6);
  }

  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: none;
    background: transparent;
    color: var(--nord5);
    font-size: 0.8rem;
    font-weight: 500;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .status-chip.active {
    background: var(--nord7);
    color: var(--nord0);
    box-shadow: 0 4px 12px rgba(143, 188, 187, 0.25);
  }

  .status-chip:not(.active):hover {
    background: rgba(94, 129, 172, 0.2);
    color: var(--nord6);
  }

  .priority-filter {
    min-width: 160px;
  }

  .priority-select {
    width: 100%;
    padding: 0.45rem 0.75rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(94, 129, 172, 0.35);
    background: rgba(46, 52, 64, 0.85);
    color: var(--nord6);
    font-size: 0.85rem;
  }

  .priority-select:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(94, 129, 172, 0.35);
    background: rgba(46, 52, 64, 0.85);
    color: var(--nord6);
  }

  .toolbar-filters .add-task-btn {
    margin-left: auto;
  }

  .search-input-wrapper input {
    flex: 1;
    background: transparent;
    border: none;
    color: inherit;
    font-size: 0.85rem;
    outline: none;
  }

  .clear-filters-btn {
    border: none;
    background: rgba(191, 97, 106, 0.15);
    color: var(--nord11);
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .clear-filters-btn:hover {
    background: rgba(191, 97, 106, 0.35);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap; 
    border: 0;
  }

  @media (max-width: 960px) {
    .toolbar-primary {
      flex-direction: column;
      align-items: stretch;
    }

    .primary-search {
      flex: 1 1 100%;
    }

    .add-task-btn {
      justify-content: center;
    }

    .toolbar-filters {
      flex-direction: column;
      align-items: stretch;
    }

    .toolbar-filters .add-task-btn {
      width: 100%;
      justify-content: center;
      margin-left: 0;
    }
  }
</style>
