<script lang="ts">
  import ProjectRow from './project-row.svelte';
  import type { ProjectWithDetails, ProjectStatus } from '$lib/types/database';
  import { navigateToProject } from '$lib/utils/navigation';
  import { compareProjectsByUpdatedAtDesc } from '$lib/utils/projectTree';

  let {
    projects = [],
    isLoading = false,
    canEdit = false,
    isAuthenticated = false,
    onstatuschange,
    onprojectedit
  } = $props<{
    projects?: ProjectWithDetails[];
    isLoading?: boolean;
    canEdit?: boolean;
    isAuthenticated?: boolean;
    onstatuschange?: (event: { project: ProjectWithDetails; newStatus: ProjectStatus }) => void;
    onprojectedit?: (event: { project: ProjectWithDetails }) => void;
  }>();

  type ProjectWithChildren = ProjectWithDetails & { children: ProjectWithChildren[] };

  const projectsByStatus = $derived(
    projects.reduce((acc: Record<ProjectStatus, ProjectWithDetails[]>, project: ProjectWithDetails) => {
      const status = (project.status ?? 'active') as ProjectStatus;
      if (!acc[status]) acc[status] = [];
      acc[status].push(project);
      return acc;
    }, {} as Record<ProjectStatus, ProjectWithDetails[]>)
  );

  const hierarchicalProjects = $derived(buildHierarchy(projects));

  function buildHierarchy(allProjects: ProjectWithDetails[]) {
    const projectMap = new Map<number, ProjectWithChildren>();
    const roots: ProjectWithChildren[] = [];

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

    const compareProjects = compareProjectsByUpdatedAtDesc as (a: ProjectWithChildren, b: ProjectWithChildren) => number;

    roots.sort(compareProjects);

    function sortChildren(nodes: ProjectWithChildren[]) {
      for (const node of nodes) {
        if (node.children.length > 0) {
          node.children.sort(compareProjects);
          sortChildren(node.children);
        }
      }
    }

    sortChildren(roots);

    return roots;
  }

  async function handleProjectClick(project: ProjectWithDetails) {
    await navigateToProject(project);
  }

  function handleStatusChange(event: { project: ProjectWithDetails; newStatus: ProjectStatus }) {
    onstatuschange?.(event);
  }

  function handleProjectEdit(event: { project: ProjectWithDetails }) {
    onprojectedit?.(event);
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
          onclick={() => handleProjectClick(project)}
          onstatuschange={(detail) => handleStatusChange(detail)}
          onedit={(detail) => handleProjectEdit(detail)}
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

  :global(.projects-table .table-body .project-row) {
    background: var(--nord0);
    transition: background 0.2s ease;
  }

  :global(.projects-table .table-body .project-row:nth-of-type(even)) {
    background: var(--nord1);
  }

  :global(.projects-table .table-body .project-row:hover) {
    background: var(--nord2);
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
