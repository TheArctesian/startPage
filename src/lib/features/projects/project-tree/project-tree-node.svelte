<script lang="ts">
  import type { ProjectNode } from '$lib/types/database';
  
  let {
    node,
    isActive = false,
    isCollapsed = false,
    showStats = true,
    onselect,
    ontoggle,
    oncontextmenu
  } = $props<{
    node: ProjectNode;
    isActive?: boolean;
    isCollapsed?: boolean;
    showStats?: boolean;
    onselect?: (event: { project: ProjectNode }) => void;
    ontoggle?: (event: { project: ProjectNode }) => void;
    oncontextmenu?: (event: { project: ProjectNode; event: MouseEvent }) => void;
  }>();

  // Calculate aggregated stats for display
  const stats = $derived(calculateDisplayStats(node));
  const indentLevel = $derived(node.depth || 0);
  const hasChildren = $derived(Boolean(node.hasChildren && node.children && node.children.length > 0));

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
    onselect?.({ project: node });
  }

  function handleToggle(event: Event) {
    event.stopPropagation();
    ontoggle?.({ project: node });
  }

  function handleRightClick(event: MouseEvent) {
    event.preventDefault();
    oncontextmenu?.({ project: node, event });
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
  class:nested={indentLevel > 0}
  style="--indent-level: {indentLevel}; --active-project-color: var({node.color})"
  role="treeitem"
  tabindex="0"
  aria-expanded={hasChildren ? node.isExpanded : undefined}
  aria-selected={isActive}
  aria-label="Project: {node.breadcrumb}"
  onclick={handleClick}
  oncontextmenu={handleRightClick}
  onkeydown={handleKeydown}
>

  
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
    {#if hasChildren}
      <span class="folder-icon">📁</span>
    {:else}
      <div class="project-dot"></div>
    {/if}
  </div>

  <!-- Privacy Indicator -->
  {#if !node.isPublic}
    <div class="privacy-indicator" title="Private project">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
        <circle cx="12" cy="16" r="1"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>
  {/if}

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
    position: relative;
    z-index: 1;
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
    font-weight: bold;
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

  .tree-node.has-children .toggle-icon {
    color: var(--nord8);
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


  .privacy-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.25rem;
    margin-right: 0.5rem;
    color: var(--nord12);
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .privacy-indicator:hover {
    opacity: 1;
  }

  /* Clean tree structure */
  .tree-node {
    padding-left: calc(var(--indent-level) * 1.5rem);
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
    padding-right: 0.5rem;
    border: none;
    background: var(--tree-background, transparent);
    transition: all 0.2s ease;
    position: relative;
  }

  /* Apply styles to nested items */
  .tree-node.nested {
    --tree-background: transparent;
  }

  .tree-node.nested:hover {
    --tree-background: var(--nord2);
  }

  /* Accessibility */
  .tree-node[aria-expanded="true"] .toggle-icon.expanded {
    transform: rotate(90deg);
  }

  .tree-node[aria-expanded="false"] .toggle-icon {
    transform: rotate(0deg);
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

  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .tree-node,
    .expand-toggle,
    .toggle-icon {
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
