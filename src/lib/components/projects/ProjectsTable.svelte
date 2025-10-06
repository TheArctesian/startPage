<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ProjectRow from './ProjectRow.svelte';
  import type { ProjectWithDetails, ProjectStatus } from '$lib/types/database';
  import { navigateToProject } from '$lib/utils/navigation';

  export let projects: ProjectWithDetails[] = [];
  export let isLoading = false;
  export let canEdit: boolean = false;
  export let isAuthenticated: boolean = false;

  const dispatch = createEventDispatcher<{
    statusChange: { project: ProjectWithDetails; newStatus: ProjectStatus };
    projectEdit: { project: ProjectWithDetails };
  }>();

  // Group projects by status for organized display
  $: projectsByStatus = projects.reduce((acc, project) => {
    const status = project.status || 'active';
    if (!acc[status]) acc[status] = [];
    acc[status].push(project);
    return acc;
  }, {} as Record<ProjectStatus, ProjectWithDetails[]>);

  // Build hierarchical structure for each status group
  $: hierarchicalProjects = buildHierarchy(projects);

  function buildHierarchy(allProjects: ProjectWithDetails[]) {
    const projectMap = new Map<number, ProjectWithDetails & { children: ProjectWithDetails[] }>();
    const roots: (ProjectWithDetails & { children: ProjectWithDetails[] })[] = [];

    // Initialize all projects with children array
    allProjects.forEach(project => {
      projectMap.set(project.id, { ...project, children: [] });
    });

    // Build hierarchy
    allProjects.forEach(project => {
      const projectWithChildren = projectMap.get(project.id)!;
      
      if (project.parentId && projectMap.has(project.parentId)) {
        const parent = projectMap.get(project.parentId)!;
        parent.children.push(projectWithChildren);
      } else {
        roots.push(projectWithChildren);
      }
    });

    return roots;
  }

  async function handleProjectClick(project: ProjectWithDetails) {
    await navigateToProject(project);
  }

  function handleStatusChange(event: CustomEvent<{ project: ProjectWithDetails; newStatus: ProjectStatus }>) {
    dispatch('statusChange', event.detail);
  }

  function handleProjectEdit(event: CustomEvent<{ project: ProjectWithDetails }>) {
    dispatch('projectEdit', event.detail);
  }
</script>

<div class="projects-table">
  <!-- Table Header -->
  <div class="table-header">
    <div class="header-row">
      <div class="col-name">Name</div>
      <div class="col-status">Status</div>
      <div class="col-tasks">Tasks</div>
      <div class="col-time">Time</div>
      <div class="col-actions">Actions</div>
    </div>
  </div>

  <!-- Table Body -->
  <div class="table-body">
    {#if isLoading}
      <div class="loading-state">
        <div class="loading-spinner loading-spinner">◐</div>
        <p>Loading projects...</p>
        <!-- Skeleton loaders -->
        <div class="skeleton-rows">
          {#each Array(3) as _, i}
            <div class="skeleton-row">
              <div class="skeleton-loader" style="width: 150px; height: 20px;"></div>
              <div class="skeleton-loader" style="width: 80px; height: 20px;"></div>
              <div class="skeleton-loader" style="width: 60px; height: 20px;"></div>
              <div class="skeleton-loader" style="width: 80px; height: 20px;"></div>
              <div class="skeleton-loader" style="width: 40px; height: 20px;"></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if hierarchicalProjects.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>No projects yet</h3>
        <p>Create your first project to start organizing your tasks</p>
      </div>
    {:else}
      {#each hierarchicalProjects as project (project.id)}
        <ProjectRow 
          {project}
          depth={0}
          {canEdit}
          {isAuthenticated}
          on:click={() => handleProjectClick(project)}
          on:statusChange={handleStatusChange}
          on:edit={handleProjectEdit}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .projects-table {
    width: 100%;
    max-width: 1200px;
    background: var(--nord1);
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--nord3);
  }

  .table-header {
    background: var(--nord2);
    border-bottom: 1px solid var(--nord3);
    padding: 0;
  }

  .header-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 1rem;
    padding: 1rem 1.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--nord6);
    text-transform: uppercase;
    letter-spacing: 0.025em;
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

  .table-body {
    max-height: 70vh;
    overflow-y: auto;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    color: var(--nord4);
    text-align: center;
  }

  .loading-spinner {
    font-size: 2rem;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
    filter: grayscale(1);
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0 0 0.5rem;
  }

  .empty-state p {
    font-size: 1rem;
    color: var(--nord4);
    margin: 0;
    max-width: 32rem;
    line-height: 1.5;
  }

  /* Skeleton loading styles */
  .skeleton-rows {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 0;
  }

  /* Mobile responsive */
  @media (max-width: 1024px) {
    .header-row {
      grid-template-columns: 2fr 1fr 1fr;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
    }

    .col-time,
    .col-actions {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .header-row {
      grid-template-columns: 2fr 1fr;
      padding: 0.5rem 0.75rem;
    }

    .col-tasks {
      display: none;
    }
  }
</style>