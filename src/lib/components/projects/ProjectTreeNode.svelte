<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ProjectNode } from '$lib/types/database';
  
  export let node: ProjectNode;
  export let isActive = false;
  export let isCollapsed = false;
  export let showStats = true;

  const dispatch = createEventDispatcher<{
    select: { project: ProjectNode };
    toggle: { project: ProjectNode };
    contextMenu: { project: ProjectNode; event: MouseEvent };
  }>();

  // Calculate aggregated stats for display
  $: stats = calculateDisplayStats(node);
  $: indentLevel = (node.depth || 0);
  $: hasChildren = node.hasChildren && node.children && node.children.length > 0;

  function calculateDisplayStats(project: ProjectNode) {
    const completionRate = project.totalTasks && project.totalTasks > 0 
      ? Math.round((project.completedTasks || 0) / project.totalTasks * 100)
      : 0;
    
    const totalHours = Math.round((project.totalMinutes || 0) / 60 * 10) / 10;
    
    return {
      completion: completionRate,
      hours: totalHours,
      tasks: project.totalTasks || 0,
      completed: project.completedTasks || 0
    };
  }

  function handleClick() {
    dispatch('select', { project: node });
  }

  function handleToggle(event: Event) {
    event.stopPropagation();
    dispatch('toggle', { project: node });
  }

  function handleRightClick(event: MouseEvent) {
    event.preventDefault();
    dispatch('contextMenu', { project: node, event });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    } else if (event.key === 'ArrowRight' && hasChildren && !node.isExpanded) {
      event.preventDefault();
      handleToggle(event);
    } else if (event.key === 'ArrowLeft' && hasChildren && node.isExpanded) {
      event.preventDefault();
      handleToggle(event);
    }
  }
</script>

<div 
  class="tree-node project-tree-node transition-colors"
  class:active={isActive}
  class:has-children={hasChildren}
  class:expanded={node.isExpanded}
  style="--indent-level: {indentLevel}; --active-project-color: var({node.color})"
  role="treeitem"
  tabindex="0"
  aria-expanded={hasChildren ? node.isExpanded : undefined}
  aria-label="Project: {node.breadcrumb}"
  onclick={handleClick}
  oncontextmenu={handleRightClick}
  onkeydown={handleKeydown}
>
  <!-- Indentation spacer -->
  <div class="indent-spacer"></div>
  
  <!-- Expand/Collapse Toggle -->
  {#if hasChildren}
    <button 
      class="expand-toggle"
      onclick={handleToggle}
      title={node.isExpanded ? 'Collapse' : 'Expand'}
      aria-label={node.isExpanded ? 'Collapse project' : 'Expand project'}
    >
      <span class="toggle-icon project-tree-chevron transition-transform" class:expanded={node.isExpanded} class:chevron-expanded={node.isExpanded}>
        ▶
      </span>
    </button>
  {:else}
    <div class="expand-spacer"></div>
  {/if}

  <!-- Project Icon/Color -->
  <div 
    class="project-indicator"
    style="background-color: {node.color}"
  >
    {#if node.icon}
      <span class="project-icon">{node.icon}</span>
    {:else if hasChildren}
      <span class="folder-icon">📁</span>
    {:else}
      <div class="project-dot"></div>
    {/if}
  </div>

  {#if !isCollapsed}
    <!-- Project Details -->
    <div class="project-details">
      <div class="project-name" title={node.breadcrumb}>
        {node.name}
      </div>
      
      {#if showStats && (stats.tasks > 0 || node.inProgressTasks > 0)}
        <div class="project-stats">
          {#if node.inProgressTasks > 0}
            <span class="stat-item in-progress" title="Tasks in progress">
              {node.inProgressTasks} in progress
            </span>
          {/if}
          
          {#if stats.hours > 0}
            <span class="stat-item" title="Time spent">
              {stats.hours}h logged
            </span>
          {/if}
        </div>

        <div class="progress-bar">
          <div 
            class="progress-fill"
            style="width: {stats.completion}%; background-color: {node.color}"
          ></div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tree-node {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    border-radius: 0.25rem;
    margin-bottom: 0.125rem;
    outline: none;
    position: relative;
  }

  .tree-node:hover {
    background: var(--nord2);
  }

  .tree-node:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 1px;
  }

  .tree-node.active {
    background: var(--active-project-color, var(--nord8));
    color: var(--nord0);
    position: relative;
  }

  .tree-node.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--active-project-color, var(--nord8));
    opacity: 0.9;
    border-radius: 0.25rem;
    z-index: -1;
  }

  .tree-node.active .project-stats,
  .tree-node.active .project-name {
    color: var(--nord0);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    font-weight: 600;
    position: relative;
    z-index: 1;
  }

  .indent-spacer {
    width: calc(var(--indent-level) * 1.5rem);
    flex-shrink: 0;
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
    border-radius: 0.125rem;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .expand-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .expand-spacer {
    width: 1.25rem;
    flex-shrink: 0;
  }

  .toggle-icon {
    font-size: 0.75rem;
    color: var(--nord4);
    transition: transform 0.2s ease;
  }

  .tree-node:hover .toggle-icon {
    color: var(--nord6);
  }

  .tree-node.active .toggle-icon {
    color: var(--nord0);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 1;
  }

  .project-indicator {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 0.625rem;
  }

  .project-icon,
  .folder-icon {
    font-size: 0.875rem;
  }

  .folder-icon {
    filter: grayscale(1);
  }

  .project-dot {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
  }

  .project-details {
    flex: 1;
    min-width: 0;
  }

  .project-name {
    font-weight: 500;
    color: var(--nord6);
    margin-bottom: 0.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.875rem;
  }

  .project-stats {
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
    font-size: 0.6875rem;
    color: var(--nord4);
    margin-bottom: 0.25rem;
  }

  .stat-item {
    display: block;
    line-height: 1.2;
  }

  .progress-bar {
    width: 100%;
    height: 0.1875rem;
    background: var(--nord3);
    border-radius: 0.09375rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 0.09375rem;
  }

  /* Connecting lines disabled to prevent visual issues
  .tree-node::before {
    content: '';
    position: absolute;
    left: calc(var(--indent-level) * 1.5rem + 0.625rem);
    top: 0;
    width: 1px;
    height: 100%;
    background: var(--nord3);
    opacity: 0.3;
  }

  .tree-node:first-child::before {
    top: 50%;
    height: 50%;
  }

  .tree-node:last-child::before {
    height: 50%;
  }

  .tree-node[style*="--indent-level: 0"]::before {
    display: none;
  }

  .tree-node::after {
    content: '';
    position: absolute;
    left: calc(var(--indent-level) * 1.5rem + 0.625rem);
    top: 50%;
    width: 0.875rem;
    height: 1px;
    background: var(--nord3);
    opacity: 0.3;
  }

  .tree-node[style*="--indent-level: 0"]::after {
    display: none;
  }
  */

  /* Accessibility */
  .tree-node[aria-expanded="true"] .toggle-icon.expanded {
    transform: rotate(0deg);
  }

  .tree-node[aria-expanded="false"] .toggle-icon {
    transform: rotate(-90deg);
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .tree-node {
      border: 1px solid transparent;
    }

    .tree-node:focus {
      border-color: var(--nord8);
    }

    .tree-node.active {
      border-color: var(--nord6);
    }

    .progress-bar {
      border: 1px solid var(--nord4);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .tree-node,
    .expand-toggle,
    .toggle-icon,
    .progress-fill {
      transition: none;
    }
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .tree-node {
      padding: 0.5rem 0.25rem;
    }

    .project-indicator {
      width: 1.5rem;
      height: 1.5rem;
      margin-right: 0.5rem;
    }

    .project-name {
      font-size: 0.8125rem;
    }

    .project-stats {
      font-size: 0.625rem;
    }
  }
</style>