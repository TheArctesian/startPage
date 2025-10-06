<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import TimerButton from '$lib/components/timer/TimerButton.svelte';
  import IntensityDisplay from '$lib/components/ui/IntensityDisplay.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let variant: 'compact' | 'detailed' | 'kanban' = 'detailed';
  export let selectable: boolean = false;
  export let selected: boolean = false;
  export let showTimer: boolean = true;
  export let showProject: boolean = false;
  export let draggable: boolean = false;
  
  // Permission props
  export let canEdit: boolean = false;
  export let isAuthenticated: boolean = false;

  // Callback props
  export let onEdit: ((task: TaskWithDetails) => void) | undefined = undefined;
  export let onDelete: ((task: TaskWithDetails) => void) | undefined = undefined;
  export let onStatusChange: ((task: TaskWithDetails, status: string) => void) | undefined = undefined;

  // Mobile detection and state
  let isMobile = false;
  let isExpanded = false;

  onMount(() => {
    isMobile = window.innerWidth < 768;
    const handleResize = () => {
      isMobile = window.innerWidth < 768;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const dispatch = createEventDispatcher<{
    select: { task: TaskWithDetails };
    edit: { task: TaskWithDetails };
    complete: { task: TaskWithDetails };
    delete: { task: TaskWithDetails };
    move: { task: TaskWithDetails; newStatus: 'todo' | 'in_progress' | 'done' };
    dragstart: { task: TaskWithDetails; event: DragEvent };
    dragend: { task: TaskWithDetails; event: DragEvent };
  }>();

  // Format due date
  function formatDueDate(date: Date | string) {
    const dueDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, class: 'overdue', urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', class: 'due-today', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', class: 'due-soon', urgent: false };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, class: 'due-soon', urgent: false };
    } else {
      return { text: dueDate.toLocaleDateString(), class: 'due-later', urgent: false };
    }
  }

  // Format relative time
  function formatRelativeTime(date: Date | string) {
    const targetDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  // Calculate total time spent
  function calculateTimeSpent() {
    if (!task.timeSessions) return 0;
    return Math.round(
      task.timeSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
    );
  }

  // Calculate time progress percentage
  function calculateTimeProgress() {
    const spent = calculateTimeSpent();
    if (!task.estimatedMinutes || spent === 0) return 0;
    return Math.min((spent / task.estimatedMinutes) * 100, 100);
  }

  // Status configuration
  const statusConfig = {
    todo: { 
      label: 'To Do', 
      icon: 'circle-empty', 
      color: 'var(--nord4)',
      bgColor: 'var(--nord2)'
    },
    in_progress: { 
      label: 'In Progress', 
      icon: 'circle-progress', 
      color: 'var(--nord8)',
      bgColor: 'rgba(136, 192, 208, 0.1)'
    },
    done: { 
      label: 'Done', 
      icon: 'circle-check', 
      color: 'var(--nord14)',
      bgColor: 'rgba(163, 190, 140, 0.1)'
    },
    archived: { 
      label: 'Archived', 
      icon: 'circle-empty', 
      color: 'var(--nord3)',
      bgColor: 'var(--nord1)'
    }
  };

  // Priority configuration
  const priorityConfig = {
    low: { label: 'Low', color: 'var(--nord4)', icon: 'flag' },
    medium: { label: 'Medium', color: 'var(--nord8)', icon: 'flag' },
    high: { label: 'High', color: 'var(--nord12)', icon: 'flag' }
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
  $: timeProgress = calculateTimeProgress();
  $: dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
  $: isOverdue = dueInfo?.class === 'overdue';
  $: isCompleted = task.status === 'done';
  $: status = statusConfig[task.status];
  $: priority = priorityConfig[task.priority];

  // Status change handlers
  function handleEdit() {
    if (onEdit) {
      onEdit(task);
    } else {
      dispatch('edit', { task });
    }
  }

  function handleDelete() {
    if (onDelete) {
      onDelete(task);
    } else {
      dispatch('delete', { task });
    }
  }

  function handleStatusChange(newStatus: 'todo' | 'in_progress' | 'done') {
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    } else {
      dispatch('move', { task, newStatus });
    }
  }

  // Move task function for mobile
  function moveTask(newStatus: 'todo' | 'in_progress' | 'done') {
    handleStatusChange(newStatus);
    isExpanded = false;
  }

  // Handle link click
  function handleLinkClick(event: Event) {
    event.stopPropagation();
  }
</script>

<div 
  class="task-card {variant}"
  class:selected
  class:completed={isCompleted}
  class:overdue={isOverdue}
  class:urgent={dueInfo?.urgent}
  class:selectable
  class:draggable
  onclick={handleClick}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  {draggable}
  {...(selectable && { tabindex: 0 })}
  role={selectable ? 'button' : 'article'}
  aria-label="Task: {task.title}"
  style="background: {status.bgColor};"
>
  <!-- Priority Indicator -->
  {#if task.priority !== 'medium'}
    <div 
      class="priority-indicator"
      style="background-color: {priority.color}"
      title="Priority: {priority.label}"
    ></div>
  {/if}

  <!-- Card Header -->
  <div class="card-header">
    <div class="header-main">
      <div class="status-badge" style="color: {status.color};" title="Status: {status.label}">
        <Icon name={status.icon} size={16} color={status.color} />
        <span class="status-text">{status.label}</span>
      </div>
      
      {#if task.priority !== 'medium'}
        <div class="priority-badge" style="color: {priority.color};" title="Priority: {priority.label}">
          <Icon name="flag" size={14} color={priority.color} />
          <span class="priority-text">{priority.label}</span>
        </div>
      {/if}
    </div>
    
    {#if variant !== 'compact'}
      <div class="header-meta">
        <span class="created-time" title="Created {formatRelativeTime(task.createdAt)}">
          <Icon name="clock" size={12} color="var(--nord4)" />
          {formatRelativeTime(task.createdAt)}
        </span>
      </div>
    {/if}
  </div>

  <!-- Card Content -->
  <div class="card-content">
    <!-- Title -->
    <h3 class="task-title" title={task.title}>
      {task.title}
    </h3>

    <!-- Description -->
    {#if task.description && variant !== 'compact'}
      <p class="task-description">{task.description}</p>
    {/if}

    <!-- Link URL -->
    {#if task.linkUrl && variant !== 'compact'}
      <div class="task-link">
        <Icon name="external-link" size={14} color="var(--nord8)" />
        <a 
          href={task.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onclick={handleLinkClick}
          class="link-url"
          title="Open link in new tab"
        >
          {new URL(task.linkUrl).hostname}
        </a>
      </div>
    {/if}

    <!-- Tags -->
    {#if task.tags && task.tags.length > 0 && variant !== 'compact'}
      <div class="task-tags">
        <Icon name="tag" size={12} color="var(--nord4)" />
        <div class="tags-list">
          {#each task.tags as tag (tag.id)}
            <span class="tag-chip" style="background-color: {tag.color || 'var(--nord3)'};">
              {tag.name}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Project Info -->
    {#if showProject && task.project}
      <div class="project-info">
        <Icon name="folder" size={14} color={task.project.color || 'var(--nord4)'} />
        <span class="project-name" style="color: {task.project.color || 'var(--nord4)'}">
          {task.project.name}
        </span>
      </div>
    {/if}
  </div>

  <!-- Time & Intensity Section -->
  <div class="metrics-section">
    <!-- Time Tracking -->
    <div class="time-metrics">
      <div class="time-row">
        <div class="time-item">
          <Icon name="clock" size={12} color="var(--nord4)" />
          <span class="time-label">Est:</span>
          <span class="time-value estimated">{task.estimatedMinutes}m</span>
        </div>
        
        {#if timeSpent > 0}
          <div class="time-item">
            <span class="time-label">Spent:</span>
            <span class="time-value actual">{timeSpent}m</span>
          </div>
        {/if}
      </div>
      
      {#if timeProgress > 0 && variant !== 'compact'}
        <div class="time-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              style="width: {timeProgress}%; background-color: {timeProgress > 100 ? 'var(--nord11)' : 'var(--nord8)'};"
            ></div>
          </div>
          <span class="progress-text">{Math.round(timeProgress)}%</span>
        </div>
      {/if}
    </div>

    <!-- Intensity -->
    <div class="intensity-section">
      <div class="intensity-row">
        <Icon name="info" size={12} color="var(--nord4)" />
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
            title="Actual difficulty"
          />
        {/if}
      </div>
    </div>
  </div>

  <!-- Due Date Section -->
  {#if dueInfo && variant !== 'compact'}
    <div class="due-section">
      <div class="due-date {dueInfo.class}">
        <Icon name="calendar" size={12} color="currentColor" />
        <span>{dueInfo.text}</span>
      </div>
    </div>
  {/if}

  <!-- Timestamps Section -->
  {#if variant === 'detailed'}
    <div class="timestamps-section">
      <div class="timestamp-row">
        {#if task.updatedAt && task.updatedAt !== task.createdAt}
          <span class="timestamp" title="Last updated {formatRelativeTime(task.updatedAt)}">
            Updated: {formatRelativeTime(task.updatedAt)}
          </span>
        {/if}
        {#if task.completedAt}
          <span class="timestamp" title="Completed {formatRelativeTime(task.completedAt)}">
            ✓ Completed: {formatRelativeTime(task.completedAt)}
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="card-actions">
    <!-- Timer Button -->
    {#if showTimer && !isCompleted}
      <TimerButton 
        {task} 
        size="sm" 
        variant="minimal"
        {canEdit}
      />
    {/if}

    <!-- Status Change Buttons (only show if user can edit) -->
    {#if canEdit && variant !== 'compact'}
      <div class="status-actions">
        {#if task.status !== 'todo'}
          <button 
            class="status-btn todo-btn"
            onclick={(e) => { e.stopPropagation(); handleStatusChange('todo'); }}
            title="Move to To Do"
            aria-label="Move to To Do"
          >
            <Icon name="circle-empty" size={12} />
            <span class="status-text">To Do</span>
          </button>
        {/if}
        
        {#if task.status !== 'in_progress'}
          <button 
            class="status-btn progress-btn"
            onclick={(e) => { e.stopPropagation(); handleStatusChange('in_progress'); }}
            title="Move to In Progress"
            aria-label="Move to In Progress"
          >
            <Icon name="circle-progress" size={12} />
            <span class="status-text">In Progress</span>
          </button>
        {/if}
        
        {#if task.status !== 'done'}
          <button 
            class="status-btn done-btn"
            onclick={(e) => { e.stopPropagation(); handleStatusChange('done'); }}
            title="Mark as Done"
            aria-label="Mark as Done"
          >
            <Icon name="circle-check" size={12} />
            <span class="status-text">Done</span>
          </button>
        {/if}
      </div>
    {/if}

    <!-- Action Buttons (only show if user can edit) -->
    {#if canEdit}
      <div class="action-buttons">
        <button 
          class="action-btn edit-btn"
          onclick={(e) => { e.stopPropagation(); handleEdit(); }}
          title="Edit task"
          aria-label="Edit task"
        >
          <Icon name="edit" size={14} color="var(--nord4)" />
        </button>
        
        <button 
          class="action-btn delete-btn"
          onclick={(e) => { e.stopPropagation(); handleDelete(); }}
          title="Delete task"
          aria-label="Delete task"
        >
          <Icon name="trash" size={14} color="var(--nord11)" />
        </button>
        
        <!-- Mobile Actions Menu -->
        {#if isMobile}
          <button 
            class="action-btn mobile-menu-btn"
            onclick={(e) => { e.stopPropagation(); isExpanded = !isExpanded; }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                isExpanded = !isExpanded;
              }
            }}
            title="More actions"
            aria-label="More actions"
            aria-expanded={isExpanded}
          >
            <Icon name="more-vertical" size={14} color="var(--nord4)" />
          </button>
        {/if}
      </div>
      
      <!-- Mobile Movement Actions -->
      {#if isMobile && isExpanded && !isCompleted}
        <div class="mobile-move-actions">
          {#if task.status === 'todo'}
            <button 
              class="move-btn start-btn"
              onclick={(e) => { e.stopPropagation(); moveTask('in_progress'); }}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  moveTask('in_progress');
                }
              }}
            >
              <Icon name="play" size={12} color="var(--nord8)" />
              Start
            </button>
          {:else if task.status === 'in_progress'}
            <button 
              class="move-btn complete-btn"
              onclick={(e) => { e.stopPropagation(); moveTask('done'); }}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  moveTask('done');
                }
              }}
            >
              <Icon name="check" size={12} color="var(--nord14)" />
              Complete
            </button>
            <button 
              class="move-btn back-btn"
              onclick={(e) => { e.stopPropagation(); moveTask('todo'); }}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  moveTask('todo');
                }
              }}
            >
              <Icon name="arrow-left" size={12} color="var(--nord4)" />
              Back
            </button>
          {:else if task.status === 'done'}
            <button 
              class="move-btn reopen-btn"
              onclick={(e) => { e.stopPropagation(); moveTask('in_progress'); }}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  moveTask('in_progress');
                }
              }}
            >
              <Icon name="rotate-ccw" size={12} color="var(--nord8)" />
              Reopen
            </button>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .task-card {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.75rem;
    padding: 1rem;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 140px;
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

  .task-card.selected {
    border-color: var(--nord8);
    box-shadow: 0 0 0 2px var(--nord8);
  }

  .task-card.completed {
    opacity: 0.8;
  }

  .task-card.completed .task-title {
    text-decoration: line-through;
    color: var(--nord4);
  }

  .task-card.overdue {
    border-color: var(--nord11);
    box-shadow: 0 0 0 1px var(--nord11);
  }

  .task-card.urgent::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 20px 20px 0;
    border-color: transparent var(--nord12) transparent transparent;
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

  /* Card Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--nord2);
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .status-text {
    font-size: 0.75rem;
  }

  .priority-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .priority-text {
    font-size: 0.75rem;
  }

  .header-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .created-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    color: var(--nord4);
  }

  /* Card Content */
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .task-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
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

  .task-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .link-url {
    color: var(--nord8);
    text-decoration: none;
    font-weight: 500;
  }

  .link-url:hover {
    color: var(--nord9);
    text-decoration: underline;
  }

  .task-tags {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .tags-list {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .tag-chip {
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--nord0);
    background: var(--nord3);
  }

  .project-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .project-name {
    font-weight: 500;
  }

  /* Metrics Section */
  .metrics-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0;
    border-top: 1px solid var(--nord2);
    border-bottom: 1px solid var(--nord2);
  }

  .time-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .time-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .time-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
  }

  .time-label {
    color: var(--nord4);
    font-weight: 500;
  }

  .time-value.estimated {
    color: var(--nord8);
    font-weight: 600;
  }

  .time-value.actual {
    color: var(--nord4);
    font-weight: 600;
  }

  .time-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .progress-bar {
    flex: 1;
    height: 4px;
    background: var(--nord3);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.6875rem;
    color: var(--nord4);
    min-width: 2.5rem;
    text-align: right;
  }

  .intensity-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .intensity-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .intensity-label {
    color: var(--nord4);
    font-weight: 500;
  }

  .intensity-separator {
    color: var(--nord4);
    font-size: 0.75rem;
  }

  /* Due Section */
  .due-section {
    display: flex;
    align-items: center;
  }

  .due-date {
    display: flex;
    align-items: center;
    gap: 0.25rem;
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

  /* Timestamps Section */
  .timestamps-section {
    font-size: 0.6875rem;
    color: var(--nord4);
  }

  .timestamp-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .timestamp {
    font-style: italic;
  }

  /* Actions */
  .card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.5rem;
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

  /* Status Action Buttons */
  .status-actions {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    padding: 0.5rem 0;
  }

  .status-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--nord3);
    background: var(--nord1);
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--nord4);
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .status-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .status-btn .status-text {
    font-size: 0.75rem;
  }

  .todo-btn:hover {
    background: var(--nord4);
    color: var(--nord0);
    border-color: var(--nord4);
  }

  .progress-btn:hover {
    background: var(--nord8);
    color: var(--nord0);
    border-color: var(--nord8);
  }

  .done-btn:hover {
    background: var(--nord14);
    color: var(--nord0);
    border-color: var(--nord14);
  }

  /* Compact Variant */
  .task-card.compact {
    padding: 0.75rem;
    min-height: 80px;
    gap: 0.5rem;
  }

  .task-card.compact .card-header {
    padding-bottom: 0.25rem;
  }

  .task-card.compact .task-title {
    font-size: 0.875rem;
    -webkit-line-clamp: 1;
  }

  .task-card.compact .metrics-section {
    gap: 0.25rem;
    padding: 0.25rem 0;
  }

  .task-card.compact .time-row {
    gap: 0.5rem;
  }

  .task-card.compact .time-item {
    font-size: 0.6875rem;
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

  /* Mobile Actions */
  .mobile-menu-btn {
    display: none;
  }

  .mobile-move-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 0 0.5rem;
    border-top: 1px solid var(--nord2);
    animation: slideDown 0.2s ease-out;
  }

  .move-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--nord3);
    background: var(--nord1);
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    min-height: 2rem;
  }

  .move-btn:hover {
    background: var(--nord2);
    transform: translateY(-1px);
  }

  .start-btn:hover {
    background: var(--nord8);
    color: white;
    border-color: var(--nord8);
  }

  .complete-btn:hover {
    background: var(--nord14);
    color: white;
    border-color: var(--nord14);
  }

  .back-btn:hover,
  .reopen-btn:hover {
    background: var(--nord3);
    border-color: var(--nord4);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .task-card {
      padding: 0.75rem;
      gap: 0.5rem;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .header-main {
      gap: 0.5rem;
    }

    .task-title {
      font-size: 0.875rem;
    }

    .time-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .action-btn {
      min-width: 44px;
      min-height: 44px;
      width: auto;
      height: auto;
      padding: 0.75rem;
    }

    .action-buttons {
      gap: 0.75rem;
    }

    .move-btn {
      flex: 1;
      justify-content: center;
      min-height: 44px;
      font-size: 0.875rem;
    }

    /* Touch feedback */
    .task-card:active {
      transform: scale(0.98);
      opacity: 0.9;
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

  .link-url:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 1px;
  }
</style>