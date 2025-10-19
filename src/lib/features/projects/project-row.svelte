<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ProjectStatusBadge from './project-status-badge.svelte';
  import ProjectStatusDropdown from './project-status-dropdown.svelte';
  import type { ProjectWithDetails, ProjectStatus } from '$lib/types/database';
  import { setProjectExpansion } from '$lib/features/projects/services/project-expansion';

  export let project: ProjectWithDetails & { children?: ProjectWithDetails[] };
  export let depth = 0;
  export let canEdit: boolean = false;
  export let isAuthenticated: boolean = false;

  const dispatch = createEventDispatcher<{
    click: void;
    statusChange: { project: ProjectWithDetails; newStatus: ProjectStatus };
    edit: { project: ProjectWithDetails };
  }>();

  let isExpanded = project.isExpanded ?? false;
  let showStatusDropdown = false;

  // Calculate project statistics based on expansion state
  $: stats = (() => {
    // When collapsed or has no children, show aggregated stats (includes subprojects)
    // When expanded and has children, show direct stats (only this project)
    const shouldShowDirect = isExpanded && hasChildren;
    
    const tasks = shouldShowDirect 
      ? (project.directTasks || 0)
      : (project.totalTasks || 0);
    const completed = shouldShowDirect 
      ? (project.directCompletedTasks || 0) 
      : (project.completedTasks || 0);
    const minutes = shouldShowDirect 
      ? (project.directMinutes || 0)
      : (project.totalMinutes || 0);
    
    return {
      completion: tasks > 0 ? Math.round((completed / tasks) * 100) : 0,
      tasks,
      completed,
      timeFormatted: formatTime(minutes),
      isAggregated: !shouldShowDirect && hasChildren
    };
  })();

  $: hasChildren = project.children && project.children.length > 0;
  $: indentStyle = `margin-left: ${depth * 1.5}rem`;

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  async function toggleExpanded() {
    if (hasChildren) {
      const nextExpanded = !isExpanded;
      isExpanded = nextExpanded;

      try {
        await setProjectExpansion(project.id, nextExpanded);
      } catch (error) {
        console.error('Failed to update project expansion state:', error);
        isExpanded = !nextExpanded;
      }
    }
  }

  function handleRowClick() {
    dispatch('click');
  }

  function handleStatusChange(newStatus: ProjectStatus) {
    dispatch('statusChange', { project, newStatus });
    showStatusDropdown = false;
  }

  function handleEdit() {
    dispatch('edit', { project });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick();
    } else if (event.key === 'ArrowRight' && hasChildren && !isExpanded) {
      event.preventDefault();
      toggleExpanded();
    } else if (event.key === 'ArrowLeft' && hasChildren && isExpanded) {
      event.preventDefault();
      toggleExpanded();
    }
  }
</script>

<!-- Main Project Row -->
<div 
  class="project-row"
  class:has-children={hasChildren}
  class:expanded={isExpanded}
  role="row"
  tabindex="0"
  onclick={handleRowClick}
  onkeydown={handleKeydown}
>
  <!-- Name Column with Expand/Collapse -->
  <div class="col-name">
    <div class="name-content" style={indentStyle}>
      {#if hasChildren}
        <button 
          class="expand-toggle"
          onclick={(e) => { e.stopPropagation(); toggleExpanded(); }}
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-label={isExpanded ? 'Collapse project' : 'Expand project'}
        >
          <span class="toggle-icon" class:expanded={isExpanded}>
            ▶
          </span>
        </button>
      {:else}
        <div class="expand-spacer"></div>
      {/if}
      
      <div 
        class="project-indicator"
        style="background-color: {project.color || 'var(--nord8)'}"
      >
        <div class="project-dot"></div>
      </div>
      
      <span class="project-name">{project.name}</span>
    </div>
  </div>

  <!-- Status Column -->
  <div class="col-status">
    <div class="status-container">
      <ProjectStatusBadge status={project.status || 'active'} />
      {#if canEdit}
        <button 
          class="status-edit-btn"
          onclick={(e) => { e.stopPropagation(); showStatusDropdown = !showStatusDropdown; }}
          title="Change status"
          aria-label="Change project status"
        >
          ⋮
        </button>
      {/if}
      
      {#if showStatusDropdown}
        <ProjectStatusDropdown
          currentStatus={project.status || 'active'}
          on:change={(e) => handleStatusChange(e.detail.status)}
          on:close={() => showStatusDropdown = false}
        />
      {/if}
    </div>
  </div>


  <!-- Tasks Column -->
  <div class="col-tasks">
    <span class="tasks-count">
      {stats.completed}/{stats.tasks}
      {#if stats.isAggregated}
        <span class="aggregated-indicator" title="Includes tasks from subprojects">+</span>
      {/if}
    </span>
  </div>

  <!-- Time Column -->
  <div class="col-time">
    <span class="time-value">{stats.timeFormatted}</span>
  </div>

  <!-- Actions Column -->
  <div class="col-actions">
    {#if canEdit}
      <button 
        class="action-btn"
        onclick={(e) => { e.stopPropagation(); handleEdit(); }}
        title="Edit project"
        aria-label="Edit project"
      >
        ✎
      </button>
    {/if}
  </div>
</div>

<!-- Child Projects (if expanded) -->
{#if hasChildren && isExpanded}
  {#each project.children as child (child.id)}
    <svelte:self 
      project={child}
      depth={depth + 1}
      {canEdit}
      {isAuthenticated}
      on:click
      on:statusChange
      on:edit
    />
  {/each}
{/if}

<style>
  .project-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--nord3);
    cursor: pointer;
    transition: all 0.2s ease;
    align-items: center;
    position: relative;
  }

  .project-row:hover {
    background: var(--nord2);
  }

  .project-row:focus {
    outline: 2px solid var(--nord8);
    outline-offset: -2px;
  }

  .col-name { grid-area: 1 / 1; }
  .col-status { 
    grid-area: 1 / 2; 
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .col-tasks { 
    grid-area: 1 / 3; 
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .col-time { grid-area: 1 / 4; }
  .col-actions { grid-area: 1 / 5; }

  .name-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .expand-toggle {
    width: 1.25rem;
    height: 1.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .expand-toggle:hover {
    background: var(--nord3);
  }

  .expand-toggle:hover .toggle-icon {
    color: var(--nord6);
  }

  .expand-toggle:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 1px;
  }

  .expand-spacer {
    width: 1.25rem;
    flex-shrink: 0;
  }

  .toggle-icon {
    font-size: 0.75rem;
    color: var(--nord4);
    transition: transform 0.2s ease;
    transform: rotate(0deg);
  }

  .toggle-icon.expanded {
    transform: rotate(90deg);
  }

  .project-indicator {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }


  .project-dot {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
  }

  .project-name {
    font-weight: 500;
    color: var(--nord6);
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-edit-btn {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    color: var(--nord4);
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    opacity: 0;
  }

  .project-row:hover .status-edit-btn {
    opacity: 1;
  }

  .status-edit-btn:hover {
    background: var(--nord3);
    color: var(--nord6);
  }


  .tasks-count,
  .time-value {
    font-size: 0.875rem;
    color: var(--nord6);
    font-weight: 500;
  }

  .aggregated-indicator {
    color: var(--nord8);
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.25rem;
    opacity: 0.8;
  }

  .action-btn {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    color: var(--nord4);
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    opacity: 1;
  }

  .action-btn:hover {
    background: var(--nord3);
    color: var(--nord6);
  }

  /* Mobile responsive */
  @media (max-width: 1024px) {
    .project-row {
      grid-template-columns: 2fr 1fr 1fr;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
    }

    .col-time,
    .col-actions {
      display: none;
    }

    .status-edit-btn {
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    .project-row {
      grid-template-columns: 2fr 1fr;
      padding: 0.5rem 0.75rem;
    }

    .col-tasks {
      display: none;
    }

    .name-content {
      gap: 0.25rem;
    }

    .project-name {
      font-size: 0.75rem;
    }
  }
</style>
