<script lang="ts">
  import IntensityDisplay from '$lib/ui/intensity-display.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import { formatDueDate, formatRelativeTime } from '$lib/utils/date';
  import { formatTime, calculateTimeSpent } from '$lib/utils/time';
  import { statusConfig, priorityConfig } from '$lib/utils/task';
  import type { TaskWithDetails } from '$lib/types/database';

  interface Props {
    tasks?: TaskWithDetails[];
    onEdit?: ((task: TaskWithDetails) => void) | undefined;
    onDelete?: ((task: TaskWithDetails) => void) | undefined;
    onStatusChange?: ((task: TaskWithDetails, status: string) => void) | undefined;
    canEdit?: boolean;
    isAuthenticated?: boolean;
    showCompleted?: boolean;
  }

  let {
    tasks = [],
    onEdit = undefined,
    onDelete = undefined,
    onStatusChange = undefined,
    canEdit = true,
    isAuthenticated = true,
    showCompleted = true
  }: Props = $props();

  // Group tasks by status
  let todoTasks = $derived(tasks.filter(task => task.status === 'todo'));
  let inProgressTasks = $derived(tasks.filter(task => task.status === 'in_progress'));
  let doneTasks = $derived(tasks.filter(task => task.status === 'done'));

  // Sorting state
  let sortColumn: 'title' | 'status' | 'priority' | 'due' | 'estimated' | 'created' = 'created';
  let sortDirection: 'asc' | 'desc' = 'desc';
  let selectedTasks = new Set<number>();

  // Combine all tasks
  let allTasks = $derived([
    ...todoTasks.map(t => ({ ...t, _status: 'todo' as const })),
    ...inProgressTasks.map(t => ({ ...t, _status: 'in_progress' as const })),
    ...(showCompleted ? doneTasks.map(t => ({ ...t, _status: 'done' as const })) : [])
  ]);

  // Sort tasks
  let sortedTasks = $derived([...allTasks].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortColumn) {
      case 'title':
        return a.title.localeCompare(b.title) * direction;
      case 'status':
        const statusOrder = { todo: 0, in_progress: 1, done: 2, archived: 3 };
        return (statusOrder[a.status] - statusOrder[b.status]) * direction;
      case 'priority':
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * direction;
      case 'due':
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return (aDate - bDate) * direction;
      case 'estimated':
        return (a.estimatedMinutes - b.estimatedMinutes) * direction;
      case 'created':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      default:
        return 0;
    }
  }));

  // Use imported configs

  // Helper functions
  function handleSort(column: typeof sortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  // formatDueDate now imported from utils

  // formatRelativeTime now imported from utils

  // calculateTimeSpent now imported from utils

  function handleTaskClick(task: TaskWithDetails, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      if (selectedTasks.has(task.id)) {
        selectedTasks.delete(task.id);
      } else {
        selectedTasks.add(task.id);
      }
      selectedTasks = new Set(selectedTasks);
    } else {
      // For now, just select - could add callback for task selection if needed
    }
  }

  function handleTaskEdit(task: TaskWithDetails) {
    if (onEdit) {
      onEdit(task);
    }
  }

  function handleTaskDelete(task: TaskWithDetails) {
    if (onDelete) {
      onDelete(task);
    }
  }

  function handleStatusChange(task: TaskWithDetails, newStatus: string) {
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    }
  }

  function handleSelectAll(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedTasks = new Set(sortedTasks.map(t => t.id));
    } else {
      selectedTasks = new Set();
    }
  }

  function handleBulkStatusChange(newStatus: 'todo' | 'in_progress' | 'done') {
    selectedTasks.forEach(taskId => {
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        handleStatusChange(task, newStatus);
      }
    });
    selectedTasks = new Set();
  }

  function handleBulkDelete() {
    if (confirm(`Delete ${selectedTasks.size} selected tasks? This cannot be undone.`)) {
      selectedTasks.forEach(taskId => {
        const task = allTasks.find(t => t.id === taskId);
        if (task) {
          handleTaskDelete(task);
        }
      });
      selectedTasks = new Set();
    }
  }

  let hasSelection = $derived(selectedTasks.size > 0);
  let allSelected = $derived(sortedTasks.length > 0 && selectedTasks.size === sortedTasks.length);
</script>

<div class="task-list-view">
  <!-- Bulk Actions Toolbar -->
  {#if hasSelection}
    <div class="bulk-actions-toolbar">
      <div class="bulk-selection-info">
        <span>{selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected</span>
      </div>
      <div class="bulk-actions">
        <button 
          class="bulk-action-btn"
          onclick={() => handleBulkStatusChange('todo')}
          title="Move to To Do"
        >
          <Icon name="circle-empty" size={14} />
          To Do
        </button>
        <button 
          class="bulk-action-btn"
          onclick={() => handleBulkStatusChange('in_progress')}
          title="Move to In Progress"
        >
          <Icon name="circle-progress" size={14} />
          In Progress
        </button>
        <button 
          class="bulk-action-btn"
          onclick={() => handleBulkStatusChange('done')}
          title="Move to Done"
        >
          <Icon name="circle-check" size={14} />
          Done
        </button>
        <div class="bulk-divider"></div>
        <button 
          class="bulk-action-btn danger"
          onclick={handleBulkDelete}
          title="Delete selected tasks"
        >
          <Icon name="trash" size={14} />
          Delete
        </button>
        <button 
          class="bulk-action-btn"
          onclick={() => selectedTasks = new Set()}
          title="Clear selection"
        >
          Clear
        </button>
      </div>
    </div>
  {/if}

  <!-- Table Header -->
  <div class="table-header">
    <div class="header-row">
      <div class="header-cell checkbox-cell">
        <input 
          type="checkbox" 
          checked={allSelected}
          onchange={handleSelectAll}
          class="task-checkbox"
        />
      </div>
      
      <button 
        class="header-cell sortable title-cell" 
        onclick={() => handleSort('title')}
        class:active={sortColumn === 'title'}
      >
        Task
        {#if sortColumn === 'title'}
          <Icon name="arrow-{sortDirection === 'asc' ? 'up' : 'down'}" size={12} />
        {/if}
      </button>
      
      <button 
        class="header-cell sortable status-cell" 
        onclick={() => handleSort('status')}
        class:active={sortColumn === 'status'}
      >
        Status
        {#if sortColumn === 'status'}
          <Icon name="arrow-{sortDirection === 'asc' ? 'up' : 'down'}" size={12} />
        {/if}
      </button>
      
      <button 
        class="header-cell sortable priority-cell" 
        onclick={() => handleSort('priority')}
        class:active={sortColumn === 'priority'}
      >
        Priority
        {#if sortColumn === 'priority'}
          <Icon name="arrow-{sortDirection === 'asc' ? 'up' : 'down'}" size={12} />
        {/if}
      </button>
      
      <button 
        class="header-cell sortable due-cell" 
        onclick={() => handleSort('due')}
        class:active={sortColumn === 'due'}
      >
        Due Date
        {#if sortColumn === 'due'}
          <Icon name="arrow-{sortDirection === 'asc' ? 'up' : 'down'}" size={12} />
        {/if}
      </button>
      
      <button 
        class="header-cell sortable time-cell" 
        onclick={() => handleSort('estimated')}
        class:active={sortColumn === 'estimated'}
      >
        Time
        {#if sortColumn === 'estimated'}
          <Icon name="arrow-{sortDirection === 'asc' ? 'up' : 'down'}" size={12} />
        {/if}
      </button>
      
      <div class="header-cell intensity-cell">Difficulty</div>
      
      <button 
        class="header-cell sortable created-cell" 
        onclick={() => handleSort('created')}
        class:active={sortColumn === 'created'}
      >
        Created
        {#if sortColumn === 'created'}
          <Icon name="arrow-{sortDirection === 'asc' ? 'up' : 'down'}" size={12} />
        {/if}
      </button>
      
      <div class="header-cell actions-cell">Actions</div>
    </div>
  </div>

  <!-- Task Rows -->
  <div class="table-body">
    {#each sortedTasks as task (task.id)}
      {@const dueInfo = formatDueDate(task.dueDate)}
      {@const timeSpent = calculateTimeSpent(task)}
      {@const status = statusConfig[task.status]}
      {@const priority = priorityConfig[task.priority]}
      {@const isSelected = selectedTasks.has(task.id)}
      
      <div
        class="task-row"
        class:selected={isSelected}
        class:completed={task.status === 'done'}
        class:overdue={typeof dueInfo === 'object' && dueInfo.class === 'overdue'}
        onclick={(e) => handleTaskClick(task, e)}
        role="button"
        tabindex="0"
      >
        <div class="task-cell checkbox-cell">
          <input 
            type="checkbox" 
            checked={isSelected}
            onchange={() => {
              if (isSelected) {
                selectedTasks.delete(task.id);
              } else {
                selectedTasks.add(task.id);
              }
              selectedTasks = new Set(selectedTasks);
            }}
            onclick={(e) => e.stopPropagation()}
            class="task-checkbox"
          />
        </div>
        
        <div class="task-cell title-cell">
          <div class="task-title-content">
            <span class="task-title" title={task.title}>{task.title}</span>
            {#if task.description}
              <span class="task-description" title={task.description}>{task.description}</span>
            {/if}
            {#if task.linkUrl}
              <a 
                href={task.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onclick={(e) => e.stopPropagation()}
                class="task-link"
                title="Open link"
              >
                <Icon name="external-link" size={12} />
                {new URL(task.linkUrl).hostname}
              </a>
            {/if}
          </div>
        </div>
        
        <div class="task-cell status-cell">
          <div class="status-badge" style="color: {status.color};">
            <Icon name={status.icon} size={14} color={status.color} />
            <span>{status.label}</span>
          </div>
        </div>
        
        <div class="task-cell priority-cell">
          {#if task.priority !== 'medium'}
            <div class="priority-badge" style="color: {priority.color};">
              <Icon name="flag" size={12} color={priority.color} />
              <span>{priority.label}</span>
            </div>
          {:else}
            <span class="priority-medium">—</span>
          {/if}
        </div>
        
        <div class="task-cell due-cell">
          {#if dueInfo && typeof dueInfo === 'object'}
            <span class="due-date {dueInfo.class}">{dueInfo.text}</span>
          {:else}
            <span class="no-due">—</span>
          {/if}
        </div>
        
        <div class="task-cell time-cell">
          <div class="time-info">
            <span class="estimated-time">{task.estimatedMinutes}m</span>
            {#if timeSpent > 0}
              <span class="time-separator">/</span>
              <span class="actual-time">{timeSpent}m</span>
            {/if}
          </div>
        </div>
        
        <div class="task-cell intensity-cell">
          <IntensityDisplay
            intensity={task.estimatedIntensity as 1 | 2 | 3 | 4 | 5}
            variant="dots"
            size="xs"
          />
        </div>
        
        <div class="task-cell created-cell">
          <span class="created-time" title="Created {new Date(task.createdAt).toLocaleString()}">
            {formatRelativeTime(task.createdAt)}
          </span>
        </div>
        
        <div class="task-cell actions-cell">
          <div class="task-actions">
            {#if canEdit}
              <button 
                class="action-btn edit-btn"
                onclick={(e) => { e.stopPropagation(); handleTaskEdit(task); }}
                title="Edit task"
              >
                <Icon name="edit" size={12} />
              </button>
              
              {#if task.status !== 'done'}
                <button 
                  class="action-btn complete-btn"
                  onclick={(e) => { e.stopPropagation(); handleStatusChange(task, 'done'); }}
                  title="Complete task"
                >
                  <Icon name="check" size={12} />
                </button>
              {/if}
              
              <button 
                class="action-btn delete-btn"
                onclick={(e) => { e.stopPropagation(); handleTaskDelete(task); }}
                title="Delete task"
              >
                <Icon name="trash" size={12} />
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if sortedTasks.length === 0}
    <div class="empty-state">
      <Icon name="circle-empty" size={48} color="var(--nord4)" />
      <h3>No tasks found</h3>
      <p>Create your first task to get started</p>
    </div>
  {/if}
</div>

<style>
  .task-list-view {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--nord0);
    border-radius: 0.75rem;
    border: 1px solid var(--nord3);
    overflow: hidden;
    margin: 1rem;
    height: calc(100vh - 10rem);
    max-height: calc(100vh - 10rem);
  }

  /* Bulk Actions Toolbar */
  .bulk-actions-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--nord1);
    border-bottom: 1px solid var(--nord3);
    gap: 1rem;
  }

  .bulk-selection-info {
    font-size: 0.875rem;
    color: var(--nord4);
    font-weight: 500;
  }

  .bulk-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .bulk-action-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--nord3);
    background: var(--nord0);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--nord6);
  }

  .bulk-action-btn:hover {
    background: var(--nord2);
    border-color: var(--nord4);
  }

  .bulk-action-btn.danger {
    color: var(--nord11);
  }

  .bulk-action-btn.danger:hover {
    background: rgba(191, 97, 106, 0.1);
    border-color: var(--nord11);
  }

  .bulk-divider {
    width: 1px;
    height: 1.5rem;
    background: var(--nord3);
    margin: 0 0.25rem;
  }

  /* Table Header */
  .table-header {
    background: var(--nord1);
    border-bottom: 1px solid var(--nord3);
  }

  .header-row {
    display: grid;
    grid-template-columns: 40px 1fr 120px 100px 100px 80px 80px 80px 120px;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    align-items: center;
  }

  .header-cell {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--nord4);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: default;
  }

  .header-cell.sortable {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0;
    border-radius: 0.25rem;
    transition: color 0.2s ease;
  }

  .header-cell.sortable:hover {
    color: var(--nord6);
  }

  .header-cell.sortable.active {
    color: var(--nord8);
  }

  /* Table Body */
  .table-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .task-row {
    display: grid;
    grid-template-columns: 40px 1fr 120px 100px 100px 80px 80px 80px 120px;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    align-items: center;
    border-bottom: 1px solid var(--nord2);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .task-row:hover {
    background: var(--nord1);
  }

  .task-row.selected {
    background: rgba(136, 192, 208, 0.1);
    border-color: var(--nord8);
  }

  .task-row.completed {
    opacity: 0.7;
  }

  .task-row.completed .task-title {
    text-decoration: line-through;
    color: var(--nord4);
  }

  .task-row.overdue {
    border-left: 3px solid var(--nord11);
  }

  .task-cell {
    display: flex;
    align-items: center;
    min-height: 2rem;
    font-size: 0.875rem;
  }

  .checkbox-cell {
    justify-content: center;
  }

  .task-checkbox {
    width: 16px;
    height: 16px;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  /* Title Cell */
  .title-cell {
    align-items: flex-start;
    padding: 0.25rem 0;
  }

  .task-title-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
  }

  .task-title {
    font-weight: 500;
    color: var(--nord6);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .task-description {
    font-size: 0.75rem;
    color: var(--nord4);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .task-link {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    color: var(--nord8);
    text-decoration: none;
  }

  .task-link:hover {
    color: var(--nord9);
    text-decoration: underline;
  }

  /* Status Cell */
  .status-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Priority Cell */
  .priority-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .priority-medium {
    color: var(--nord4);
    font-size: 0.875rem;
  }

  /* Due Date Cell */
  .due-date {
    font-size: 0.75rem;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  .due-date.overdue {
    background: var(--nord11);
    color: white;
  }

  .due-date.due-today {
    background: var(--nord12);
    color: white;
  }

  .due-date.due-soon {
    background: var(--nord13);
    color: white;
  }

  .due-date.due-later {
    color: var(--nord4);
  }

  .no-due {
    color: var(--nord4);
    font-size: 0.875rem;
  }

  /* Time Cell */
  .time-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
  }

  .estimated-time {
    color: var(--nord8);
    font-weight: 600;
  }

  .time-separator {
    color: var(--nord4);
  }

  .actual-time {
    color: var(--nord4);
    font-weight: 500;
  }

  /* Created Cell */
  .created-time {
    font-size: 0.75rem;
    color: var(--nord4);
  }

  /* Actions Cell */
  .task-actions {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .action-btn {
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid var(--nord3);
    background: var(--nord1);
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    opacity: 0.7;
  }

  .task-row:hover .action-btn {
    opacity: 1;
  }

  .action-btn:hover {
    background: var(--nord2);
    transform: translateY(-1px);
  }

  .edit-btn:hover {
    background: var(--nord8);
    color: white;
    border-color: var(--nord8);
  }

  .complete-btn:hover {
    background: var(--nord14);
    color: white;
    border-color: var(--nord14);
  }

  .delete-btn:hover {
    background: var(--nord11);
    color: white;
    border-color: var(--nord11);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--nord4);
  }

  .empty-state h3 {
    margin: 1rem 0 0.5rem;
    color: var(--nord6);
    font-size: 1rem;
    font-weight: 500;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--nord4);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .header-row,
    .task-row {
      grid-template-columns: 40px 1fr 100px 80px 80px 100px;
    }

    .priority-cell,
    .intensity-cell,
    .created-cell {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .task-list-view {
      margin: 0.5rem;
      font-size: 0.875rem;
    }
    
    .header-row,
    .task-row {
      grid-template-columns: 30px 1fr 80px 80px;
      gap: 0.5rem;
      padding: 0.5rem;
    }
    
    .header-cell,
    .task-cell {
      font-size: 0.75rem;
    }
    
    /* Hide columns that don't fit on mobile */
    .priority-cell,
    .due-cell,
    .time-cell,
    .intensity-cell,
    .created-cell {
      display: none;
    }
    
    .checkbox-cell {
      justify-content: center;
    }
    
    .task-checkbox {
      width: 14px;
      height: 14px;
    }
    
    .title-cell {
      padding: 0.25rem 0;
    }
    
    .task-title {
      font-size: 0.875rem;
      -webkit-line-clamp: 1;
    }
    
    .task-description {
      font-size: 0.75rem;
      -webkit-line-clamp: 1;
    }
    
    .status-badge {
      font-size: 0.75rem;
    }
    
    .status-badge span {
      display: none;
    }
    
    .task-actions {
      gap: 0.25rem;
    }
    
    .action-btn {
      width: 1.75rem;
      height: 1.75rem;
      opacity: 1;
    }
    
    .bulk-actions-toolbar {
      padding: 0.5rem;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .bulk-action-btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  }
</style>
