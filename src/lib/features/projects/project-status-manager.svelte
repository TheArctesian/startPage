<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ProjectStatusBadge from './project-status-badge.svelte';
  import ProjectStatusDropdown from './project-status-dropdown.svelte';
  import type { ProjectWithDetails, ProjectStatus } from '$lib/types/database';

  export let project: ProjectWithDetails;
  export let subProjects: ProjectWithDetails[] = [];

  const dispatch = createEventDispatcher<{
    statusChange: { project: ProjectWithDetails; newStatus: ProjectStatus };
    edit: { project: ProjectWithDetails };
  }>();

  let showStatusDropdown = false;

  // Group projects by status
  $: allProjects = [project, ...subProjects];
  $: projectsByStatus = {
    active: allProjects.filter(p => p.status === 'active'),
    done: allProjects.filter(p => p.status === 'done'),
    archived: allProjects.filter(p => p.status === 'archived')
  };

  // Calculate summary statistics
  $: stats = {
    totalProjects: allProjects.length,
    activeCount: projectsByStatus.active.length,
    doneCount: projectsByStatus.done.length,
    archivedCount: projectsByStatus.archived.length,
    totalTasks: allProjects.reduce((sum, p) => sum + (p.totalTasks || 0), 0),
    completedTasks: allProjects.reduce((sum, p) => sum + (p.completedTasks || 0), 0),
    totalMinutes: allProjects.reduce((sum, p) => sum + (p.totalMinutes || 0), 0)
  };

  $: completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  function handleStatusChange(newStatus: ProjectStatus) {
    dispatch('statusChange', { project, newStatus });
    showStatusDropdown = false;
  }

  function handleProjectEdit() {
    dispatch('edit', { project });
  }

  function handleSubProjectStatusChange(subProject: ProjectWithDetails, newStatus: ProjectStatus) {
    dispatch('statusChange', { project: subProject, newStatus });
  }

  function handleSubProjectEdit(subProject: ProjectWithDetails) {
    dispatch('edit', { project: subProject });
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
</script>

<div class="project-status-manager">
  <!-- Main Project Header -->
  <div class="project-header">
    <div class="project-info">
      <div class="project-title">
        <div 
          class="project-indicator"
          style="background-color: {project.color || 'var(--nord8)'}"
        >
          <div class="project-dot"></div>
        </div>
        <h1 class="project-name">{project.name}</h1>
        <button 
          class="project-edit-btn"
          onclick={handleProjectEdit}
          title="Edit project"
          aria-label="Edit project"
        >
          ✎
        </button>
      </div>
      
      <div class="project-status">
        <div class="status-container">
          <ProjectStatusBadge status={project.status || 'active'} />
          <button 
            class="status-edit-btn"
            onclick={() => showStatusDropdown = !showStatusDropdown}
            title="Change status"
            aria-label="Change project status"
          >
            ⋮
          </button>
          
          {#if showStatusDropdown}
            <ProjectStatusDropdown
              currentStatus={project.status || 'active'}
              on:change={(e) => handleStatusChange(e.detail.status)}
              on:close={() => showStatusDropdown = false}
            />
          {/if}
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="project-stats">
      <div class="stat-item">
        <span class="stat-value">{completionRate}%</span>
        <span class="stat-label">Complete</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{stats.completedTasks}/{stats.totalTasks}</span>
        <span class="stat-label">Tasks</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{formatTime(stats.totalMinutes)}</span>
        <span class="stat-label">Time</span>
      </div>
    </div>
  </div>

  <!-- Status Columns -->
  <div class="status-columns">
    <!-- Active Projects -->
    <div class="status-column active-column">
      <div class="column-header">
        <h3 class="column-title">
          <span class="column-icon">●</span>
          Active
        </h3>
        <span class="column-count">{projectsByStatus.active.length}</span>
      </div>
      
      {#if projectsByStatus.active.length > 0}
        <div class="project-list">
          {#each projectsByStatus.active as activeProject (activeProject.id)}
            <div class="project-item" class:main-project={activeProject.id === project.id}>
              <div class="item-info">
                <span class="item-name">{activeProject.name}</span>
                {#if activeProject.id === project.id}
                  <span class="main-label">Main</span>
                {/if}
              </div>
              <div class="item-actions">
                <button 
                  class="item-edit-btn"
                  onclick={() => activeProject.id === project.id ? handleProjectEdit() : handleSubProjectEdit(activeProject)}
                  title="Edit project"
                >
                  ✎
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-column">
          <span class="empty-text">No active projects</span>
        </div>
      {/if}
    </div>

    <!-- Done Projects -->
    <div class="status-column done-column">
      <div class="column-header">
        <h3 class="column-title">
          <span class="column-icon">✓</span>
          Done
        </h3>
        <span class="column-count">{projectsByStatus.done.length}</span>
      </div>
      
      {#if projectsByStatus.done.length > 0}
        <div class="project-list">
          {#each projectsByStatus.done as doneProject (doneProject.id)}
            <div class="project-item" class:main-project={doneProject.id === project.id}>
              <div class="item-info">
                <span class="item-name">{doneProject.name}</span>
                {#if doneProject.id === project.id}
                  <span class="main-label">Main</span>
                {/if}
              </div>
              <div class="item-actions">
                <button 
                  class="item-edit-btn"
                  onclick={() => doneProject.id === project.id ? handleProjectEdit() : handleSubProjectEdit(doneProject)}
                  title="Edit project"
                >
                  ✎
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-column">
          <span class="empty-text">No completed projects</span>
        </div>
      {/if}
    </div>

    <!-- Archived Projects -->
    <div class="status-column archived-column">
      <div class="column-header">
        <h3 class="column-title">
          <span class="column-icon">📦</span>
          Archived
        </h3>
        <span class="column-count">{projectsByStatus.archived.length}</span>
      </div>
      
      {#if projectsByStatus.archived.length > 0}
        <div class="project-list">
          {#each projectsByStatus.archived as archivedProject (archivedProject.id)}
            <div class="project-item" class:main-project={archivedProject.id === project.id}>
              <div class="item-info">
                <span class="item-name">{archivedProject.name}</span>
                {#if archivedProject.id === project.id}
                  <span class="main-label">Main</span>
                {/if}
              </div>
              <div class="item-actions">
                <button 
                  class="item-edit-btn"
                  onclick={() => archivedProject.id === project.id ? handleProjectEdit() : handleSubProjectEdit(archivedProject)}
                  title="Edit project"
                >
                  ✎
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-column">
          <span class="empty-text">No archived projects</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .project-status-manager {
    background: var(--nord1);
    border-bottom: 1px solid var(--nord3);
    padding: 1.5rem;
  }

  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 2rem;
  }

  .project-info {
    flex: 1;
    min-width: 0;
  }

  .project-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .project-indicator {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .project-icon {
    font-size: 1.125rem;
  }

  .project-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
  }

  .project-name {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .project-edit-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: var(--nord4);
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .project-edit-btn:hover {
    background: var(--nord3);
    color: var(--nord6);
    opacity: 1;
  }

  .project-status {
    display: flex;
    align-items: center;
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
  }

  .status-edit-btn:hover {
    background: var(--nord3);
    color: var(--nord6);
  }

  .project-stats {
    display: flex;
    gap: 2rem;
    align-items: center;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--nord6);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--nord4);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    margin-top: 0.25rem;
  }

  .status-columns {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1.5rem;
  }

  .status-column {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .column-header {
    padding: 1rem;
    background: var(--nord2);
    border-bottom: 1px solid var(--nord3);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .column-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .column-icon {
    font-size: 0.75rem;
  }

  .active-column .column-icon {
    color: var(--nord14);
  }

  .done-column .column-icon {
    color: var(--nord8);
  }

  .archived-column .column-icon {
    color: var(--nord4);
  }

  .column-count {
    font-size: 0.75rem;
    color: var(--nord4);
    background: var(--nord3);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    min-width: 1.5rem;
    text-align: center;
  }

  .project-list {
    padding: 0.5rem;
    max-height: 12rem;
    overflow-y: auto;
  }

  .project-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.375rem;
    transition: background 0.2s ease;
    gap: 0.5rem;
  }

  .project-item:hover {
    background: var(--nord2);
  }

  .project-item.main-project {
    background: var(--nord8);
    color: var(--nord0);
  }

  .project-item.main-project:hover {
    background: var(--nord9);
  }

  .item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-name {
    font-size: 0.875rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .main-label {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    padding: 0.125rem 0.375rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    opacity: 0.8;
  }

  .item-actions {
    display: flex;
    gap: 0.25rem;
  }

  .item-edit-btn {
    width: 1.25rem;
    height: 1.25rem;
    border: none;
    background: transparent;
    color: var(--nord4);
    cursor: pointer;
    border-radius: 0.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.625rem;
    opacity: 0;
  }

  .project-item:hover .item-edit-btn {
    opacity: 1;
  }

  .item-edit-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--nord6);
  }

  .project-item.main-project .item-edit-btn {
    color: var(--nord0);
  }

  .project-item.main-project .item-edit-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--nord0);
  }

  .empty-column {
    padding: 2rem 1rem;
    text-align: center;
  }

  .empty-text {
    font-size: 0.875rem;
    color: var(--nord4);
    font-style: italic;
  }

  /* Mobile responsive */
  @media (max-width: 1024px) {
    .project-status-manager {
      padding: 1rem;
    }

    .project-header {
      flex-direction: column;
      gap: 1rem;
    }

    .project-stats {
      gap: 1rem;
      justify-content: center;
    }

    .status-columns {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .project-list {
      max-height: 8rem;
    }
  }

  @media (max-width: 640px) {
    .project-status-manager {
      padding: 0.75rem;
    }

    .project-title {
      gap: 0.5rem;
    }

    .project-name {
      font-size: 1.25rem;
    }

    .project-stats {
      gap: 0.75rem;
    }

    .stat-value {
      font-size: 1.25rem;
    }

    .status-columns {
      gap: 0.75rem;
    }

    .column-header {
      padding: 0.75rem;
    }

    .project-list {
      max-height: 6rem;
    }

    .item-edit-btn {
      opacity: 1;
    }
  }

  /* Scrollbar styling */
  .project-list::-webkit-scrollbar {
    width: 0.25rem;
  }

  .project-list::-webkit-scrollbar-track {
    background: var(--nord3);
    border-radius: 0.125rem;
  }

  .project-list::-webkit-scrollbar-thumb {
    background: var(--nord4);
    border-radius: 0.125rem;
  }

  .project-list::-webkit-scrollbar-thumb:hover {
    background: var(--nord6);
  }
</style>