<script lang="ts">
  import Icon from '$lib/ui/icon.svelte';
  import IntensityDisplay from '$lib/ui/intensity-display.svelte';
  import { formatDueDate, formatRelativeTime } from '$lib/utils/date';
  import { formatTime, calculateTimeSpent, calculateTimeProgress } from '$lib/utils/time';
  import { statusConfig, priorityConfig } from '$lib/utils/task';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let variant: 'compact' | 'detailed' | 'kanban' = 'detailed';
  export let showProject: boolean = false;
  export let selected: boolean = false;

  $: timeSpent = calculateTimeSpent(task);
  $: timeProgress = calculateTimeProgress(task);
  $: dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
  $: isOverdue = typeof dueInfo === 'object' && dueInfo?.class === 'overdue';
  $: isCompleted = task.status === 'done';
  $: status = statusConfig[task.status];
  $: priority = priorityConfig[task.priority];
</script>

<div 
  class="task-card-display"
  class:selected
  class:completed={isCompleted}
  class:overdue={isOverdue}
  class:urgent={typeof dueInfo === 'object' && dueInfo?.urgent}
  data-variant={variant}
>
  <!-- Status indicator -->
  <div class="status-indicator" style="color: {status.color}">
    <Icon name={status.icon} size="sm" />
  </div>

  <div class="task-content">
    <!-- Title and description -->
    <div class="task-header">
      <h3 class="task-title">{task.title}</h3>
      {#if task.description && variant !== 'compact'}
        <p class="task-description">{task.description}</p>
      {/if}
    </div>

    <!-- Metadata row -->
    <div class="task-metadata">
      <!-- Priority -->
      <div class="priority-indicator" style="color: {priority.color}">
        <Icon name={priority.icon} size="xs" />
        <span class="priority-label">{priority.label}</span>
      </div>

      <!-- Time information -->
      {#if timeSpent > 0 || task.estimatedMinutes}
        <div class="time-info">
          {#if timeSpent > 0}
            <span class="time-spent">{formatTime(timeSpent)}</span>
          {/if}
          {#if task.estimatedMinutes}
            <span class="time-estimated">/ {formatTime(task.estimatedMinutes)}</span>
          {/if}
        </div>
      {/if}

      <!-- Due date -->
      {#if dueInfo && typeof dueInfo === 'object'}
        <div class="due-date" class:overdue={dueInfo.class === 'overdue'}>
          <Icon name="calendar" size="xs" />
          <span>{dueInfo.text}</span>
        </div>
      {/if}

      <!-- Project info -->
      {#if showProject && task.project}
        <div class="project-info">
          <Icon name="folder" size="xs" />
          <span>{task.project.name}</span>
        </div>
      {/if}
    </div>

    <!-- Progress bar -->
    {#if task.estimatedMinutes && timeSpent > 0 && variant !== 'compact'}
      <div class="progress-container">
        <div 
          class="progress-bar" 
          style="width: {timeProgress}%"
          class:overdue={timeProgress > 100}
        ></div>
      </div>
    {/if}

    <!-- Intensity display -->
    {#if task.estimatedIntensity && variant === 'detailed'}
      <div class="intensity-container">
        <IntensityDisplay intensity={task.estimatedIntensity} label="Estimated" />
        {#if task.actualIntensity}
          <IntensityDisplay intensity={task.actualIntensity} label="Actual" />
        {/if}
      </div>
    {/if}

    <!-- Timestamps -->
    {#if variant === 'detailed'}
      <div class="timestamps">
        <span class="created-at">Created {formatRelativeTime(task.createdAt)}</span>
        {#if task.updatedAt && task.updatedAt !== task.createdAt}
          <span class="updated-at">Updated {formatRelativeTime(task.updatedAt)}</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .task-card-display {
    display: flex !important;
    gap: 0.75rem !important;
    padding: 1rem !important;
    background: var(--nord1, #3b4252) !important;
    border: 1px solid var(--nord3, #4c566a) !important;
    border-radius: 8px !important;
    transition: all 0.2s ease !important;
    box-sizing: border-box !important;
    width: 100% !important;
    position: relative !important;
  }

  .task-card-display.selected {
    border-color: var(--nord8, #88c0d0);
    box-shadow: 0 0 0 2px rgba(136, 192, 208, 0.2);
  }

  .task-card-display.completed {
    opacity: 0.7;
    background: var(--nord2, #434c5e);
  }

  .task-card-display.overdue {
    border-color: var(--nord11, #bf616a);
    background: rgba(191, 97, 106, 0.1);
  }

  .task-card-display[data-variant="compact"] {
    padding: 0.5rem;
  }

  .status-indicator {
    display: flex !important;
    align-items: flex-start !important;
    margin-top: 0.125rem !important;
    flex-shrink: 0 !important;
  }

  /* Ensure icons within status indicator render properly */
  :global(.status-indicator svg) {
    display: inline-block !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
    stroke: currentColor !important;
    fill: none !important;
  }

  .task-content {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
    min-width: 0 !important;
  }

  .task-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .task-title {
    margin: 0 !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: var(--nord6, #eceff4) !important;
    line-height: 1.3 !important;
    font-family: inherit !important;
    text-decoration: none !important;
  }

  .task-description {
    margin: 0 !important;
    font-size: 0.875rem !important;
    color: var(--nord5, #e5e9f0) !important;
    line-height: 1.4 !important;
    font-family: inherit !important;
  }

  .task-metadata {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 0.75rem !important;
    align-items: center !important;
    font-size: 0.75rem !important;
    color: var(--nord4, #d8dee9) !important;
  }

  /* Ensure metadata icons render properly */
  :global(.task-metadata svg) {
    display: inline-block !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
    width: 12px !important;
    height: 12px !important;
    stroke: currentColor !important;
    fill: none !important;
  }

  .priority-indicator {
    display: flex !important;
    align-items: center !important;
    gap: 0.25rem !important;
    flex-shrink: 0 !important;
  }

  .time-info {
    display: flex !important;
    align-items: center !important;
    gap: 0.25rem !important;
    flex-shrink: 0 !important;
  }

  .time-spent {
    font-weight: 600;
  }

  .time-estimated {
    opacity: 0.7;
  }

  .due-date {
    display: flex !important;
    align-items: center !important;
    gap: 0.25rem !important;
    flex-shrink: 0 !important;
  }

  .due-date.overdue {
    color: var(--nord11, #bf616a);
    font-weight: 600;
  }

  .project-info {
    display: flex !important;
    align-items: center !important;
    gap: 0.25rem !important;
    flex-shrink: 0 !important;
  }

  .progress-container {
    width: 100% !important;
    height: 4px !important;
    background: var(--nord3, #4c566a) !important;
    border-radius: 2px !important;
    overflow: hidden !important;
    position: relative !important;
  }

  .progress-bar {
    height: 100%;
    background: var(--nord8, #88c0d0);
    transition: width 0.3s ease;
  }

  .progress-bar.overdue {
    background: var(--nord11, #bf616a);
  }

  .intensity-container {
    display: flex !important;
    gap: 1rem !important;
    flex-wrap: wrap !important;
  }

  .timestamps {
    display: flex;
    gap: 1rem;
    font-size: 0.6875rem;
    color: var(--nord4, #d8dee9);
  }

  @media (max-width: 640px) {
    .task-metadata {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .intensity-container {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>