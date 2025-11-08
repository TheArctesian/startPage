<script lang="ts">
  import { fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import ProjectTreeNode from './project-tree-node.svelte';
  import type { ProjectNode, ProjectTreeData } from '$lib/types/database';
  import { flattenTree } from '$lib/utils/projectTree';
  import { toggleProjectExpanded } from '$lib/stores';

  let {
    treeData = null,
    activeProjectId = null,
    isCollapsed = false,
    showStats = true,
    loading = false,
    onprojectselect,
    onprojecttoggle,
    onexpandall,
    oncollapseall,
    onrefresh,
    canViewPrivateProjects = false
  } = $props<{
    treeData?: ProjectTreeData | null;
    activeProjectId?: number | null;
    isCollapsed?: boolean;
    showStats?: boolean;
    loading?: boolean;
    onprojectselect?: (event: { project: ProjectNode }) => void;
    onprojecttoggle?: (event: { project: ProjectNode }) => void;
    onexpandall?: () => void;
    oncollapseall?: () => void;
    onrefresh?: () => void;
    canViewPrivateProjects?: boolean;
  }>();

  const visibleFilter = (project: ProjectNode) => canViewPrivateProjects || project.isPublic;

  // Flattened tree for rendering (respects expanded/collapsed state)
  const flatProjects = $derived(
    treeData ? flattenTree(treeData.roots, true, visibleFilter) : []
  );
  const allVisibleProjects = $derived(
    treeData ? flattenTree(treeData.roots, false, visibleFilter) : []
  );
  const hasProjects = $derived(allVisibleProjects.length > 0);

  function handleProjectSelect(event: { project: ProjectNode }) {
    onprojectselect?.(event);
  }

  async function handleProjectToggle(event: { project: ProjectNode }) {
    try {
      // Store action handles optimistic update, backend persistence, and error rollback
      await toggleProjectExpanded(event.project.id);
      onprojecttoggle?.(event);
    } catch (error) {
      console.error('Failed to toggle project:', error);
      // Error already handled by store action with rollback
    }
  }

  function handleContextMenu(event: { project: ProjectNode; event: MouseEvent }) {
    // Context menu functionality not implemented
    console.log('Context menu for project:', event.project.name);
  }

  async function handleExpandAll() {
    if (!treeData) {
      onexpandall?.();
      return;
    }

    try {
      // Toggle each visible project that isn't already expanded - store handles mutations
      const togglePromises = allVisibleProjects.map(node => {
        if (!node.isExpanded) {
          return toggleProjectExpanded(node.id);
        }
        return Promise.resolve();
      });

      await Promise.all(togglePromises);
      onexpandall?.();
    } catch (error) {
      console.error('Failed to expand all projects:', error);
    }
  }

  async function handleCollapseAll() {
    if (!treeData) {
      oncollapseall?.();
      return;
    }

    try {
      // Toggle each visible project that is currently expanded - store handles mutations
      const togglePromises = allVisibleProjects.map(node => {
        if (node.isExpanded) {
          return toggleProjectExpanded(node.id);
        }
        return Promise.resolve();
      });

      await Promise.all(togglePromises);
      oncollapseall?.();
    } catch (error) {
      console.error('Failed to collapse all projects:', error);
    }
  }

  function handleRefresh() {
    onrefresh?.();
  }

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!hasProjects) return;

    // Find currently focused project
    const activeElement = document.activeElement;
    const currentIndex = flatProjects.findIndex(project => 
      activeElement?.getAttribute('aria-label')?.includes(project.name)
    );

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = Math.min(currentIndex + 1, flatProjects.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = flatProjects.length - 1;
        break;
      default:
        return;
    }

    // Focus the next/previous project
    if (nextIndex !== currentIndex) {
      const nextProject = flatProjects[nextIndex];
      const nextElement = document.querySelector(
        `[aria-label*="${nextProject.name}"]`
      ) as HTMLElement;
      nextElement?.focus();
    }
  }
</script>

<div 
  class="project-tree"
  class:collapsed={isCollapsed}
  role="tree"
  aria-label="Project hierarchy"
  tabindex="0"
  onkeydown={handleKeydown}
>
  {#if !isCollapsed}
    <!-- Tree Controls -->
    <div class="tree-controls">
      <div class="control-group">
        <button 
          class="control-btn tooltip-trigger"
          onclick={handleExpandAll}
          data-tooltip="Expand all projects"
          aria-label="Expand all projects"
          disabled={!hasProjects}
        >
          <span class="control-icon">⊞</span>
        </button>
        
        <button 
          class="control-btn tooltip-trigger"
          onclick={handleCollapseAll}
          data-tooltip="Collapse all projects"
          aria-label="Collapse all projects"
          disabled={!hasProjects}
        >
          <span class="control-icon">⊟</span>
        </button>
        
        <button 
          class="control-btn tooltip-trigger"
          onclick={handleRefresh}
          data-tooltip="Refresh project tree"
          aria-label="Refresh project tree"
        >
          <span class="control-icon" class:spinning={loading}>↻</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- Tree Content -->
  <div class="tree-content">
    {#if loading}
      <div class="loading-state" transition:fade={{ duration: 200 }}>
        <div class="loading-spinner">◐</div>
        <span class="loading-text">Loading projects...</span>
      </div>
    {:else if !hasProjects}
      <div class="empty-state" transition:fade={{ duration: 200 }}>
        {#if !isCollapsed}
          <div class="empty-icon">📂</div>
          <div class="empty-text">No projects yet</div>
        {:else}
          <div class="empty-icon-small">∅</div>
        {/if}
      </div>
    {:else}
      <div class="tree-list" transition:fade={{ duration: 200 }}>
        {#each flatProjects as project (project.id)}
          <div
            in:slide={{ duration: 250, easing: quintOut, axis: 'y' }}
            out:slide={{ duration: 200, easing: quintOut, axis: 'y' }}
          >
            <ProjectTreeNode
              node={project}
              isActive={activeProjectId === project.id}
              {isCollapsed}
              {showStats}
              onselect={handleProjectSelect}
              ontoggle={handleProjectToggle}
              oncontextmenu={handleContextMenu}
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .project-tree {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--nord0);
  }

  .tree-controls {
    padding: 0.5rem;
    border-bottom: 1px solid var(--nord3);
    background: var(--nord1);
  }

  .control-group {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-start;
  }

  .control-btn {
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: transparent;
    color: var(--nord4);
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .control-btn:hover:not(:disabled) {
    background: var(--nord2);
    color: var(--nord6);
  }

  .control-btn:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 1px;
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tooltip-trigger {
    position: relative;
  }

  .tooltip-trigger::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 0.35rem);
    left: 50%;
    transform: translateX(-50%) translateY(0.25rem);
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

  .tooltip-trigger:focus-visible::after,
  .tooltip-trigger:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .control-icon {
    font-size: 0.875rem;
    transition: transform 0.2s ease;
  }

  .control-icon.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .tree-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .tree-list {
    padding: 0.25rem;
    position: relative;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    gap: 0.75rem;
    color: var(--nord4);
  }

  .loading-spinner {
    font-size: 1.5rem;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: 0.875rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    color: var(--nord4);
    text-align: center;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    opacity: 0.6;
    filter: grayscale(1);
  }

  .empty-icon-small {
    font-size: 1.5rem;
    opacity: 0.6;
  }

  .empty-text {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  /* Collapsed state */
  .project-tree.collapsed .tree-controls {
    padding: 0.25rem;
  }

  .project-tree.collapsed .control-group {
    flex-direction: column;
    align-items: center;
  }

  .project-tree.collapsed .control-btn {
    width: 2rem;
    height: 2rem;
  }

  /* Scrollbar styling */
  .tree-content::-webkit-scrollbar {
    width: 0.375rem;
  }

  .tree-content::-webkit-scrollbar-track {
    background: var(--nord1);
  }

  .tree-content::-webkit-scrollbar-thumb {
    background: var(--nord3);
    border-radius: 0.1875rem;
  }

  .tree-content::-webkit-scrollbar-thumb:hover {
    background: var(--nord4);
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .tree-controls {
      border-width: 2px;
    }

    .control-btn {
      border: 1px solid transparent;
    }

    .control-btn:focus {
      border-color: var(--nord8);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .control-btn,
    .control-icon,
    .loading-spinner {
      transition: none;
      animation: none;
    }
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .tree-controls {
      padding: 0.375rem;
    }

    .control-btn {
      width: 2rem;
      height: 2rem;
    }

    .control-icon {
      font-size: 1rem;
    }

    .loading-state,
    .empty-state {
      padding: 1.5rem 0.75rem;
    }
  }
</style>
