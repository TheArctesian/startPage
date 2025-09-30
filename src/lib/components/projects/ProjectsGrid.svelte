<script lang="ts">
  import { onMount } from 'svelte';
  import { projects, projectStats, setActiveProject, loadProjects } from '$lib/stores';
  import type { ProjectWithDetails } from '$lib/types/database';

  export let onProjectSelect: (project: ProjectWithDetails) => void = () => {};

  let isLoading = false;

  onMount(async () => {
    isLoading = true;
    try {
      await loadProjects(true); // Load with stats
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      isLoading = false;
    }
  });

  function handleProjectClick(project: ProjectWithDetails) {
    setActiveProject(project);
    onProjectSelect(project);
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
</script>

<div class="projects-grid-container">
  <div class="projects-header">
    <h1 class="projects-title">Your Projects</h1>
    <p class="projects-subtitle">Select a project to start tracking tasks and time</p>
  </div>

  {#if isLoading}
    <div class="loading-state">
      <div class="loading-spinner">◐</div>
      <p>Loading projects...</p>
    </div>
  {:else if $projectStats.length === 0}
    <div class="empty-state">
      <div class="empty-icon">□</div>
      <h2 class="empty-title">No projects yet</h2>
      <p class="empty-description">
        Create your first project to start organizing your tasks and tracking productivity
      </p>
      <button class="btn btn-primary" onclick={() => {}}>
        Create Project
      </button>
    </div>
  {:else}
    <div class="projects-grid">
      {#each $projectStats as project (project.id)}
        <div 
          class="project-card"
          role="button"
          tabindex="0"
          onclick={() => handleProjectClick(project)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleProjectClick(project);
            }
          }}
        >
          <div class="project-header">
            <div class="project-icon">{project.icon || '●'}</div>
            <div class="project-info">
              <h3 class="project-name">{project.name}</h3>
              <p class="project-description">{project.description || 'No description'}</p>
            </div>
          </div>
          
          <div class="project-stats">
            <div class="stat">
              <span class="stat-value">{project.totalTasks}</span>
              <span class="stat-label">Tasks</span>
            </div>
            <div class="stat">
              <span class="stat-value">{project.completedTasks}</span>
              <span class="stat-label">Done</span>
            </div>
            <div class="stat">
              <span class="stat-value">{formatTime(project.totalMinutes)}</span>
              <span class="stat-label">Time</span>
            </div>
          </div>
          
          <div class="project-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                style="width: {project.completionRate}%"
              ></div>
            </div>
            <span class="progress-text">{Math.round(project.completionRate)}% complete</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .projects-grid-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    overflow-y: auto;
  }

  .projects-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .projects-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0 0 0.5rem;
  }

  .projects-subtitle {
    font-size: 1.125rem;
    color: var(--nord4);
    margin: 0;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 20rem;
    gap: 1rem;
  }

  .loading-spinner {
    font-size: 2rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 20rem;
    gap: 1rem;
  }

  .empty-icon {
    font-size: 4rem;
    color: var(--nord4);
    margin-bottom: 1rem;
  }

  .empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .empty-description {
    font-size: 1rem;
    color: var(--nord4);
    text-align: center;
    max-width: 24rem;
    margin: 0;
    line-height: 1.5;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .project-card {
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 0.5rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .project-card:hover {
    background: var(--nord2);
    border-color: var(--nord8);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .project-card:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  .project-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .project-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--nord2);
    border-radius: 0.375rem;
  }

  .project-info {
    flex: 1;
    min-width: 0;
  }

  .project-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0 0 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .project-description {
    font-size: 0.875rem;
    color: var(--nord4);
    margin: 0;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .project-stats {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-value {
    font-size: 1.25rem;
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

  .project-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-bar {
    height: 0.25rem;
    background: var(--nord3);
    border-radius: 0.125rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--nord14);
    transition: width 0.3s ease;
    border-radius: 0.125rem;
  }

  .progress-text {
    font-size: 0.75rem;
    color: var(--nord4);
    text-align: center;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: var(--nord8);
    color: var(--nord0);
  }

  .btn-primary:hover {
    background: var(--nord9);
    transform: translateY(-1px);
  }

  .btn-primary:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .projects-grid-container {
      padding: 1rem;
    }

    .projects-title {
      font-size: 2rem;
    }

    .projects-subtitle {
      font-size: 1rem;
    }

    .projects-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .project-card {
      padding: 1rem;
    }

    .project-stats {
      gap: 0.5rem;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .project-card,
    .progress-fill,
    .btn,
    .loading-spinner {
      transition: none;
      animation: none;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .project-card {
      border-width: 2px;
    }

    .progress-bar {
      border: 1px solid var(--nord4);
    }
  }
</style>