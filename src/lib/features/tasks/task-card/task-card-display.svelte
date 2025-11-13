<script lang="ts">
  import Icon from '$lib/ui/icon.svelte';
  import IntensityDisplay from '$lib/ui/intensity-display.svelte';
  import { formatDueDate, formatRelativeTime } from '$lib/utils/date';
  import { formatTime, calculateTimeSpent, calculateTimeProgress } from '$lib/utils/time';
  import { statusConfig, priorityConfig } from '$lib/utils/task';
  import type { TaskWithDetails } from '$lib/types/database';

  interface Props {
    task: TaskWithDetails;
    variant?: 'compact' | 'detailed' | 'kanban';
    showProject?: boolean;
    selected?: boolean;
  }

  let {
    task,
    variant = 'detailed',
    showProject = false,
    selected = false
  }: Props = $props();

  let timeSpent = $derived(calculateTimeSpent(task));
  let timeProgress = $derived(calculateTimeProgress(task));
  let dueInfo = $derived(task.dueDate ? formatDueDate(task.dueDate) : null);
  let isOverdue = $derived(typeof dueInfo === 'object' && dueInfo?.class === 'overdue');
  let isCompleted = $derived(task.status === 'done');
  let status = $derived(statusConfig[task.status]);
  let priority = $derived(priorityConfig[task.priority]);
</script>

<div 
  class="task-card-display"
  class:selected
  class:completed={isCompleted}
  class:overdue={isOverdue}
  class:urgent={typeof dueInfo === 'object' && dueInfo?.urgent}
  data-variant={variant}
  style={`--status-color: ${status.color}; --status-bg: ${status.bgColor ?? 'transparent'}; --priority-color: ${priority.color};`}
>
  <div class="task-content">
    <!-- Title and description -->
    <div class="task-header">
      <div class="title-row">
        <span
          class="status-marker"
          role="img"
          aria-label={`Task status: ${status.label}`}
          data-status={task.status}
        ></span>
        <div class="title-stack">
          <h3 class="task-title">{task.title}</h3>
          {#if task.description && variant !== 'compact'}
            <p class="task-description">{task.description}</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Metadata row -->
    <div class="task-metadata">
      <div class="metadata-group">
        <span class="priority-chip">
          {#if priority.icon}
            <Icon name={priority.icon} size="xs" />
          {/if}
          <span class="priority-label">{priority.label}</span>
        </span>

        {#if timeSpent > 0 || task.estimatedMinutes}
          <span class="meta-item time">
            {#if timeSpent > 0}
              <span class="time-spent">{formatTime(timeSpent)}</span>
            {/if}
            {#if timeSpent > 0 && task.estimatedMinutes}
              <span class="meta-divider" aria-hidden="true">•</span>
            {/if}
            {#if task.estimatedMinutes}
              <span class="time-estimated">{formatTime(task.estimatedMinutes)}</span>
            {/if}
          </span>
        {/if}
      </div>

      <div class="metadata-group trailing">
        {#if dueInfo && typeof dueInfo === 'object'}
          <span class="meta-item due-date" class:overdue={dueInfo.class === 'overdue'}>
            <Icon name="calendar" size="xs" />
            <span>{dueInfo.text}</span>
          </span>
        {/if}

        {#if showProject && task.project}
          <span class="meta-item project-info">
            <Icon name="folder" size="xs" />
            <span>{task.project.name}</span>
          </span>
        {/if}
      </div>
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
        <div class="intensity-item">
          <IntensityDisplay
            intensity={task.estimatedIntensity as import('$lib/types/database').IntensityLevel}
            showValue
          />
          <span class="intensity-label">Estimated</span>
        </div>
        {#if task.actualIntensity}
          <div class="intensity-item">
            <IntensityDisplay
              intensity={task.actualIntensity as import('$lib/types/database').IntensityLevel}
              showValue
            />
            <span class="intensity-label">Actual</span>
          </div>
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
    background: linear-gradient(145deg, rgba(67, 76, 94, 0.9), rgba(59, 66, 82, 0.95)) !important;
    border: 1px solid rgba(136, 192, 208, 0.16) !important;
    border-radius: 12px !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease !important;
    box-sizing: border-box !important;
    width: 100% !important;
    position: relative !important;
  }

  .task-card-display:hover {
    border-color: rgba(136, 192, 208, 0.4);
    background: linear-gradient(145deg, rgba(76, 86, 106, 0.98), rgba(59, 66, 82, 0.98));
    box-shadow: 0 12px 28px rgba(9, 17, 26, 0.35);
  }

  .task-card-display.selected {
    border-color: var(--nord8, #88c0d0) !important;
    box-shadow: 0 0 0 2px rgba(136, 192, 208, 0.25) !important;
  }

  .task-card-display.completed {
    opacity: 0.75;
    background: linear-gradient(145deg, rgba(67, 76, 94, 0.65), rgba(59, 66, 82, 0.75)) !important;
  }

  .task-card-display.overdue {
    border-color: var(--nord11, #bf616a) !important;
    background: linear-gradient(145deg, rgba(191, 97, 106, 0.18), rgba(76, 86, 106, 0.85)) !important;
  }

  .task-card-display[data-variant="compact"] {
    padding: 0.75rem !important;
    border-radius: 10px !important;
  }

  .task-content {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
    min-width: 0 !important;
  }

  .task-header {
    display: flex !important;
    flex-direction: column !important;
  }

  .title-row {
    display: flex !important;
    align-items: flex-start !important;
    gap: 0.75rem !important;
  }

  .title-stack {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.35rem !important;
    min-width: 0 !important;
  }

  .status-marker {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 1.25rem !important;
    height: 1.25rem !important;
    border-radius: 50% !important;
    border: 2px solid var(--status-color, var(--nord4)) !important;
    background: var(--status-bg, transparent) !important;
    box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.08) !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    flex-shrink: 0 !important;
  }

  .status-marker::after {
    content: '' !important;
    display: block !important;
    width: 0.5rem !important;
    height: 0.5rem !important;
    border-radius: 50% !important;
    background: var(--status-color, var(--nord4)) !important;
    transition: transform 0.2s ease, opacity 0.2s ease !important;
  }

  .status-marker[data-status="todo"]::after {
    opacity: 0;
    transform: scale(0.4);
  }

  .status-marker[data-status="in_progress"]::after {
    opacity: 0.6;
    transform: scale(0.75);
  }

  .status-marker[data-status="done"]::after {
    opacity: 1;
    transform: scale(1);
  }

  .status-marker[data-status="archived"] {
    border-style: dashed !important;
    opacity: 0.6 !important;
  }

  .status-marker[data-status="archived"]::after {
    opacity: 0.2;
    transform: scale(0.6);
  }

  .task-title {
    margin: 0 !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: var(--nord6, #eceff4) !important;
    line-height: 1.35 !important;
    font-family: inherit !important;
    text-decoration: none !important;
  }

  .task-description {
    margin: 0 !important;
    font-size: 0.875rem !important;
    color: var(--nord5, #e5e9f0) !important;
    line-height: 1.45 !important;
    font-family: inherit !important;
  }

  .task-metadata {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 0.75rem !important;
    align-items: center !important;
    justify-content: space-between !important;
    font-size: 0.8125rem !important;
    color: var(--nord4, #d8dee9) !important;
  }

  .metadata-group {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    flex-wrap: wrap !important;
  }

  .metadata-group.trailing {
    margin-left: auto !important;
    justify-content: flex-end !important;
  }

  .priority-chip {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.35rem !important;
    padding: 0.25rem 0.6rem !important;
    border-radius: 999px !important;
    border: 1px solid var(--priority-color, var(--nord8)) !important;
    color: var(--priority-color, var(--nord8)) !important;
    background: rgba(12, 16, 24, 0.25) !important;
    font-weight: 600 !important;
    letter-spacing: 0.01em !important;
    text-transform: none !important;
  }

  :global(.priority-chip svg),
  :global(.meta-item svg) {
    display: inline-block !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
    width: 12px !important;
    height: 12px !important;
    stroke: currentColor !important;
    fill: none !important;
  }

  .meta-item {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.35rem !important;
    color: inherit !important;
    font-weight: 500 !important;
  }

  .meta-item.time {
    color: var(--nord5, #e5e9f0) !important;
  }

  .meta-divider {
    opacity: 0.6 !important;
    font-size: 0.75em !important;
  }

  .time-spent {
    font-weight: 600 !important;
  }

  .time-estimated {
    opacity: 0.8 !important;
  }

  .due-date.overdue {
    color: var(--nord11, #bf616a) !important;
    font-weight: 600 !important;
  }

  .progress-container {
    width: 100% !important;
    height: 5px !important;
    background: rgba(76, 86, 106, 0.65) !important;
    border-radius: 999px !important;
    overflow: hidden !important;
    position: relative !important;
  }

  .progress-bar {
    height: 100% !important;
    background: var(--nord8, #88c0d0) !important;
    transition: width 0.3s ease, background 0.2s ease !important;
  }

  .progress-bar.overdue {
    background: var(--nord11, #bf616a) !important;
  }

  .intensity-container {
    display: flex !important;
    gap: 1rem !important;
    flex-wrap: wrap !important;
  }

  .intensity-item {
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
  }

  .intensity-label {
    font-size: 0.75rem !important;
    color: var(--text-secondary, var(--nord4)) !important;
  }

  .timestamps {
    display: flex !important;
    gap: 1rem !important;
    font-size: 0.6875rem !important;
    color: var(--nord4, #d8dee9) !important;
  }

  @media (max-width: 640px) {
    .task-card-display {
      padding: 0.85rem !important;
    }

    .task-metadata {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.5rem !important;
    }

    .metadata-group.trailing {
      margin-left: 0 !important;
      justify-content: flex-start !important;
    }

    .intensity-container {
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
  }
</style>
