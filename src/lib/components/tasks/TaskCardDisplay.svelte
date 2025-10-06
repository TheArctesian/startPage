<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import IntensityDisplay from '$lib/components/ui/IntensityDisplay.svelte';
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
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--nord6);
    border: 1px solid var(--nord4);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .task-card-display.selected {
    border-color: var(--nord8);
    box-shadow: 0 0 0 2px rgba(136, 192, 208, 0.2);
  }

  .task-card-display.completed {
    opacity: 0.7;
    background: var(--nord5);
  }

  .task-card-display.overdue {
    border-color: var(--nord11);
    background: rgba(191, 97, 106, 0.05);
  }

  .task-card-display[data-variant="compact"] {
    padding: 0.5rem;
  }

  .status-indicator {
    display: flex;
    align-items: flex-start;
    margin-top: 0.125rem;
  }

  .task-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .task-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .task-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--nord0);
    line-height: 1.3;
  }

  .task-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--nord1);
    line-height: 1.4;
  }

  .task-metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    font-size: 0.75rem;
    color: var(--nord2);
  }

  .priority-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .time-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .time-spent {
    font-weight: 600;
  }

  .time-estimated {
    opacity: 0.7;
  }

  .due-date {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .due-date.overdue {
    color: var(--nord11);
    font-weight: 600;
  }

  .project-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .progress-container {
    width: 100%;
    height: 4px;
    background: var(--nord4);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: var(--nord8);
    transition: width 0.3s ease;
  }

  .progress-bar.overdue {
    background: var(--nord11);
  }

  .intensity-container {
    display: flex;
    gap: 1rem;
  }

  .timestamps {
    display: flex;
    gap: 1rem;
    font-size: 0.6875rem;
    color: var(--nord3);
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