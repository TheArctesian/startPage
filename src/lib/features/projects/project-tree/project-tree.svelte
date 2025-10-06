<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import ProjectTreeNode from './project-tree-node.svelte';
  import type { ProjectNode, ProjectTreeData } from '$lib/types/database';
  import { buildProjectTree, flattenTree, toggleExpanded } from '$lib/utils/projectTree';

  export let treeData: ProjectTreeData | null = null;
  export let activeProjectId: number | null = null;
  export let isCollapsed = false;
  export let showStats = true;
  export let loading = false;

  const dispatch = createEventDispatcher<{
    projectSelect: { project: ProjectNode };
    projectToggle: { project: ProjectNode };
    expandAll: void;
    collapseAll: void;
    refresh: void;
  }>();

  // Flattened tree for rendering (respects expanded/collapsed state)
  $: flatProjects = treeData ? flattenTree(treeData.roots, true) : [];
  $: hasProjects = flatProjects.length > 0;

  function handleProjectSelect(event: CustomEvent<{ project: ProjectNode }>) {
    dispatch('projectSelect', event.detail);
  }

  async function handleProjectToggle(event: CustomEvent<{ project: ProjectNode }>) {
    const { project } = event.detail;
    
    try {
      // Update local state immediately for responsive UI
      if (treeData) {
        const node = treeData.flatMap.get(project.id);
        if (node) {
          node.isExpanded = !node.isExpanded;
          // Force reactivity update
          treeData = { ...treeData };
        }
      }

      // Persist state to backend
      const response = await fetch('/api/projects/tree', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          isExpanded: !project.isExpanded
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update project state');
      }

      dispatch('projectToggle', event.detail);
    } catch (error) {
      console.error('Error toggling project:', error);
      // Revert local state on error
      if (treeData) {
        const node = treeData.flatMap.get(project.id);
        if (node) {
          node.isExpanded = !node.isExpanded;
          treeData = { ...treeData };
        }
      }
    }
  }

  function handleContextMenu(event: CustomEvent<{ project: ProjectNode; event: MouseEvent }>) {
    // Context menu functionality not implemented
    console.log('Context menu for project:', event.detail.project.name);
  }

  function handleExpandAll() {
    if (treeData) {
      // Update all nodes to expanded
      for (const node of treeData.flatMap.values()) {
        node.isExpanded = true;
      }
      treeData = { ...treeData };
    }
    dispatch('expandAll');
  }

  function handleCollapseAll() {
    if (treeData) {
      // Update all nodes to collapsed
      for (const node of treeData.flatMap.values()) {
        node.isExpanded = false;
      }
      treeData = { ...treeData };
    }
    dispatch('collapseAll');
  }

  function handleRefresh() {
    dispatch('refresh');
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
          class="control-btn"
          onclick={handleExpandAll}
          title="Expand all projects"
          aria-label="Expand all projects"
          disabled={!hasProjects}
        >
          <span class="control-icon">⊞</span>
        </button>
        
        <button 
          class="control-btn"
          onclick={handleCollapseAll}
          title="Collapse all projects"
          aria-label="Collapse all projects"
          disabled={!hasProjects}
        >
          <span class="control-icon">⊟</span>
        </button>
        
        <button 
          class="control-btn"
          onclick={handleRefresh}
          title="Refresh project tree"
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
          <ProjectTreeNode
            node={project}
            isActive={activeProjectId === project.id}
            {isCollapsed}
            {showStats}
            on:select={handleProjectSelect}
            on:toggle={handleProjectToggle}
            on:contextMenu={handleContextMenu}
          />
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