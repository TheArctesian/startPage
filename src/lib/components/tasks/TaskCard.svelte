<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import TimerControls from '$lib/components/timer/TimerControls.svelte';
  import IntensityDisplay from '$lib/components/ui/IntensityDisplay.svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let variant: 'compact' | 'detailed' | 'kanban' = 'detailed';
  export let selectable: boolean = false;
  export let selected: boolean = false;
  export let showTimer: boolean = true;
  export let showProject: boolean = false;
  export let draggable: boolean = false;

  const dispatch = createEventDispatcher<{
    select: { task: TaskWithDetails };
    edit: { task: TaskWithDetails };
    complete: { task: TaskWithDetails };
    delete: { task: TaskWithDetails };
    dragstart: { task: TaskWithDetails; event: DragEvent };
    dragend: { task: TaskWithDetails; event: DragEvent };
  }>();

  // Format due date
  function formatDueDate(date: Date | string) {
    const dueDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, class: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Due today', class: 'due-today' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', class: 'due-soon' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, class: 'due-soon' };
    } else {
      return { text: dueDate.toLocaleDateString(), class: 'due-later' };
    }
  }

  // Calculate total time spent
  function calculateTimeSpent() {
    if (!task.timeSessions) return 0;
    return Math.round(
      task.timeSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
    );
  }

  // Status colors
  const statusColors = {
    todo: 'var(--nord4)',
    in_progress: 'var(--nord8)', 
    done: 'var(--nord14)',
    archived: 'var(--nord3)'
  };

  // Priority colors
  const priorityColors = {
    low: 'var(--nord4)',
    medium: 'var(--nord8)',
    high: 'var(--nord12)'
  };

  // Handle card click
  function handleClick() {
    if (selectable) {
      dispatch('select', { task });
    }
  }

  // Handle drag events
  function handleDragStart(event: DragEvent) {
    if (!draggable) return;
    
    event.dataTransfer?.setData('text/plain', task.id.toString());
    dispatch('dragstart', { task, event });
  }

  function handleDragEnd(event: DragEvent) {
    if (!draggable) return;
    dispatch('dragend', { task, event });
  }

  $: timeSpent = calculateTimeSpent();
  $: dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
  $: isOverdue = dueInfo?.class === 'overdue';
  $: isCompleted = task.status === 'done';
</script>

<div 
  class="task-card {variant} hover-lift transition-all"
  class:selected
  class:completed={isCompleted}
  class:overdue={isOverdue}
  class:selectable
  class:draggable
  onclick={handleClick}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  {draggable}
  tabindex={selectable ? 0 : -1}
  role={selectable ? 'button' : 'article'}
  aria-label="Task: {task.title}"
>
  <!-- Priority Indicator -->
  {#if task.priority !== 'medium'}
    <div 
      class="priority-indicator"
      style="background-color: {priorityColors[task.priority]}"
      title="Priority: {task.priority}"
    ></div>
  {/if}

  <!-- Main Content -->
  <div class="card-content">
    <!-- Header -->
    <div class="card-header">
      <h3 class="task-title" title={task.title}>
        {task.title}
      </h3>
      
      <!-- Status Badge -->
      <div 
        class="status-badge {task.status}"
        style="color: {statusColors[task.status]}"
        title="Status: {task.status}"
      >
        {#if task.status === 'todo'}
          ○
        {:else if task.status === 'in_progress'}
          ▶
        {:else if task.status === 'done'}
          ✓
        {:else if task.status === 'archived'}
          ■
        {/if}
      </div>
    </div>

    <!-- Description -->
    {#if task.description && variant !== 'compact'}
      <p class="task-description">{task.description}</p>
    {/if}

    <!-- Project Info -->
    {#if showProject && task.project}
      <div class="project-info">
        <span class="project-name" style="color: {task.project.color}">
          {#if task.project.icon}{task.project.icon}{/if}
          {task.project.name}
        </span>
      </div>
    {/if}

    <!-- Metadata Row -->
    <div class="task-metadata">
      <!-- Time Information -->
      <div class="time-info">
        <div class="time-label">
          <span class="time-label-text">Est:</span>
          <span class="estimated-time">
            {task.estimatedMinutes}m
          </span>
        </div>
        
        {#if timeSpent > 0}
          <div class="time-label">
            <span class="time-label-text">Spent:</span>
            <span class="actual-time">
              {timeSpent}m
            </span>
          </div>
        {/if}
      </div>

      <!-- Intensity Display -->
      <div class="intensity-info">
        <span class="intensity-label">Difficulty:</span>
        <IntensityDisplay 
          intensity={task.estimatedIntensity} 
          variant="dots" 
          size={variant === 'compact' ? 'xs' : 'sm'}
        />
        
        {#if task.actualIntensity && variant !== 'compact'}
          <span class="intensity-separator">→</span>
          <IntensityDisplay 
            intensity={task.actualIntensity} 
            variant="dots" 
            size="sm"
          />
        {/if}
      </div>
    </div>

    <!-- Due Date -->
    {#if dueInfo && variant !== 'compact'}
      <div class="due-date {dueInfo.class}">
        {dueInfo.text}
      </div>
    {/if}

    <!-- Actions -->
    <div class="card-actions">
      <!-- Timer Controls -->
      {#if showTimer && !isCompleted}
        <TimerControls 
          {task} 
          size="sm" 
          variant="minimal"
        />
      {/if}

      <!-- Action Buttons -->
      <div class="action-buttons">
        {#if !isCompleted}
          <button 
            class="action-btn edit-btn"
            onclick={(e) => { e.stopPropagation(); dispatch('edit', { task }); }}
            title="Edit task"
            aria-label="Edit task"
          >
            ✏️
          </button>
          
          <button 
            class="action-btn complete-btn"
            onclick={(e) => { e.stopPropagation(); dispatch('complete', { task }); }}
            title="Complete task"
            aria-label="Complete task"
          >
            ✓
          </button>
        {/if}
        
        <button 
          class="action-btn delete-btn"
          onclick={(e) => { e.stopPropagation(); dispatch('delete', { task }); }}
          title="Delete task"
          aria-label="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .task-card {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.75rem;
    padding: 1.25rem;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    min-height: 120px;
    width: 100%;
    box-sizing: border-box;
  }

  .task-card:hover {
    border-color: var(--nord4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .task-card.selectable {
    cursor: pointer;
  }

  .task-card.selectable:hover {
    transform: translateY(-1px);
  }

  .task-card.selected {
    border-color: var(--nord8);
    box-shadow: 0 0 0 2px var(--nord8);
  }

  .task-card.completed {
    opacity: 0.7;
    background: var(--nord1);
  }

  .task-card.overdue {
    border-color: var(--nord11);
  }

  .task-card.draggable {
    cursor: grab;
  }

  .task-card.draggable:active {
    cursor: grabbing;
  }

  /* Priority Indicator */
  .priority-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    border-radius: 0.5rem 0 0 0.5rem;
  }

  /* Card Content */
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    justify-content: space-between;
    width: 100%;
    flex: 1;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .task-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .status-badge {
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .task-description {
    font-size: 0.875rem;
    color: var(--nord4);
    margin: 0;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .project-info {
    font-size: 0.75rem;
  }

  .project-name {
    font-weight: 500;
  }

  .task-metadata {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.8125rem;
    padding: 0.5rem 0;
    border-top: 1px solid var(--nord2);
  }

  .time-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .time-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .time-label-text {
    font-size: 0.75rem;
    color: var(--nord4);
    font-weight: 500;
  }

  .estimated-time {
    color: var(--nord8);
    font-weight: 600;
  }

  .actual-time {
    color: var(--nord4);
    font-weight: 600;
  }

  .intensity-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .intensity-label {
    font-size: 0.75rem;
    color: var(--nord4);
    font-weight: 500;
  }

  .intensity-separator {
    color: var(--nord4);
    font-size: 0.75rem;
  }

  .due-date {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  .due-date.overdue {
    background: var(--nord11);
    color: var(--nord6);
  }

  .due-date.due-today {
    background: var(--nord12);
    color: var(--nord0);
  }

  .due-date.due-soon {
    background: var(--nord13);
    color: var(--nord0);
  }

  .due-date.due-later {
    background: var(--nord3);
    color: var(--nord4);
  }

  .card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--nord2);
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--nord3);
    background: var(--nord1);
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .action-btn:hover {
    background: var(--nord2);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .edit-btn:hover {
    background: var(--nord8);
    color: var(--nord0);
    border-color: var(--nord8);
  }

  .complete-btn:hover {
    background: var(--nord14);
    color: var(--nord0);
    border-color: var(--nord14);
  }

  .delete-btn:hover {
    background: var(--nord11);
    color: var(--nord6);
    border-color: var(--nord11);
  }

  /* Compact Variant */
  .task-card.compact {
    padding: 0.75rem;
  }

  .task-card.compact .card-content {
    gap: 0.5rem;
  }

  .task-card.compact .task-title {
    font-size: 0.875rem;
    -webkit-line-clamp: 1;
  }

  .task-card.compact .task-metadata {
    font-size: 0.625rem;
  }

  /* Kanban Variant */
  .task-card.kanban {
    margin-bottom: 0.5rem;
    cursor: grab;
    width: 100%;
  }

  .task-card.kanban:active {
    cursor: grabbing;
    transform: rotate(2deg);
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .task-card {
      padding: 0.75rem;
    }

    .task-title {
      font-size: 0.875rem;
    }

    .task-metadata {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .action-buttons {
      justify-content: flex-end;
    }
  }

  /* Focus styles for accessibility */
  .task-card:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  .action-btn:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 1px;
  }
</style>