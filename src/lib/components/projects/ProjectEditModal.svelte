<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { updateProject } from '$lib/stores';
  import type { Project, ProjectWithDetails } from '$lib/types/database';

  export let isOpen = false;
  export let project: Project | null = null;

  const dispatch = createEventDispatcher<{
    close: void;
    updated: { project: Project };
  }>();

  // Form state
  let editName = '';
  let editDescription = '';
  let editIcon = '';
  let editColor = '--nord8';
  let editParentId: string | number | null = null;
  let isUpdating = false;
  let errorMessage = '';
  let availableParents: ProjectWithDetails[] = [];
  let loadingParents = false;

  // Color options for projects
  const colorOptions = [
    { name: 'Blue', value: '--nord8', bg: 'var(--nord8)' },
    { name: 'Cyan', value: '--nord7', bg: 'var(--nord7)' },
    { name: 'Teal', value: '--nord9', bg: 'var(--nord9)' },
    { name: 'Purple', value: '--nord10', bg: 'var(--nord10)' },
    { name: 'Green', value: '--nord14', bg: 'var(--nord14)' },
    { name: 'Orange', value: '--nord12', bg: 'var(--nord12)' },
    { name: 'Red', value: '--nord11', bg: 'var(--nord11)' },
    { name: 'Yellow', value: '--nord13', bg: 'var(--nord13)' }
  ];

  // Icon suggestions
  const iconSuggestions = [
    '■', '□', '▲', '△', '▶', '▷', '◆', '◇',
    '○', '●', '◎', '◍', '★', '☆', '◈', '◉'
  ];

  // Load available parent projects (excluding self and descendants)
  async function loadAvailableParents() {
    if (!project) return;
    
    loadingParents = true;
    try {
      const response = await fetch('/api/projects?stats=false');
      if (response.ok) {
        const allProjects = await response.json();
        
        // Filter out current project and its descendants to prevent circular references
        availableParents = allProjects.filter((p: Project) => {
          // Exclude self
          if (p.id === project.id) return false;
          
          // Exclude descendants (projects that have this project in their path)
          if (p.path && project.path) {
            return !p.path.startsWith(project.path + '/') && p.path !== project.path;
          }
          
          // For root projects, exclude direct children
          if (!project.path || project.path === project.name) {
            return p.parentId !== project.id;
          }
          
          return true;
        });
      }
    } catch (error) {
      console.error('Failed to load available parents:', error);
      availableParents = [];
    } finally {
      loadingParents = false;
    }
  }

  // Reset form when modal opens
  $: if (isOpen && project) {
    editName = project.name;
    editDescription = project.description || '';
    editIcon = project.icon || '';
    editColor = project.color || '--nord8';
    editParentId = project.parentId || '';
    errorMessage = '';
    loadAvailableParents();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleClose() {
    isOpen = false;
    dispatch('close');
  }

  async function handleSubmit() {
    if (!project || !editName.trim() || isUpdating) return;

    isUpdating = true;
    errorMessage = '';

    try {
      // Clean parentId similar to ProjectSidebar
      let cleanParentId: number | null = null;
      if (editParentId && typeof editParentId === 'number') {
        cleanParentId = editParentId;
      } else if (editParentId && typeof editParentId === 'string' && editParentId !== '') {
        const parsed = parseInt(editParentId);
        if (!isNaN(parsed)) {
          cleanParentId = parsed;
        }
      }

      const updates = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        icon: editIcon || undefined,
        color: editColor,
        parentId: cleanParentId
      };

      const updatedProject = await updateProject(project.id, updates);
      dispatch('updated', { project: updatedProject });
      handleClose();
    } catch (error) {
      console.error('Failed to update project:', error);
      errorMessage = 'Failed to update project. Please try again.';
    } finally {
      isUpdating = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function setIcon(icon: string) {
    editIcon = icon;
  }
</script>

{#if isOpen && project}
  <div 
    class="modal-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-project-title"
    tabindex="-1"
  >
    <div class="modal-content">
      <!-- Modal Header -->
      <div class="modal-header">
        <h3 id="edit-project-title" class="modal-title">Edit Project</h3>
        <button 
          class="close-btn"
          onclick={handleClose}
          title="Close"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <form class="edit-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {#if errorMessage}
          <div class="error-message">
            {errorMessage}
          </div>
        {/if}

        <!-- Project Name -->
        <div class="form-group">
          <label for="edit-project-name" class="form-label">Project Name *</label>
          <input
            bind:value={editName}
            type="text"
            id="edit-project-name"
            class="form-input"
            placeholder="Enter project name..."
            maxlength="255"
            required
          />
        </div>

        <!-- Project Description -->
        <div class="form-group">
          <label for="edit-project-description" class="form-label">Description</label>
          <textarea
            bind:value={editDescription}
            id="edit-project-description"
            class="form-textarea"
            placeholder="Describe this project..."
            rows="3"
          ></textarea>
        </div>

        <!-- Parent Project -->
        <div class="form-group">
          <label for="edit-project-parent" class="form-label">Parent Project</label>
          <select
            bind:value={editParentId}
            id="edit-project-parent"
            class="form-input"
            disabled={loadingParents}
          >
            <option value="">None (Root Project)</option>
            {#if loadingParents}
              <option disabled>Loading...</option>
            {:else}
              {#each availableParents as parent}
                <option value={parent.id}>{parent.name}</option>
              {/each}
            {/if}
          </select>
        </div>

        <!-- Project Icon -->
        <div class="form-group">
          <label for="edit-project-icon" class="form-label">Icon (optional)</label>
          <input
            bind:value={editIcon}
            type="text"
            id="edit-project-icon"
            class="form-input"
            placeholder="◆"
            maxlength="10"
          />
          
          <!-- Icon Suggestions -->
          <div class="icon-suggestions">
            {#each iconSuggestions as icon}
              <button
                type="button"
                class="icon-suggestion"
                class:selected={editIcon === icon}
                onclick={() => setIcon(icon)}
                title="Use {icon} icon"
              >
                {icon}
              </button>
            {/each}
          </div>
        </div>

        <!-- Project Color -->
        <div class="form-group">
          <fieldset class="form-fieldset">
            <legend class="form-label">Color</legend>
            <div class="color-options">
              {#each colorOptions as color}
                <button
                  type="button"
                  class="color-option"
                  class:selected={editColor === color.value}
                  style="background-color: {color.bg}"
                  onclick={() => editColor = color.value}
                  title={color.name}
                  aria-label="Select {color.name} color"
                >
                  {#if editColor === color.value}
                    ✓
                  {/if}
                </button>
              {/each}
            </div>
          </fieldset>
        </div>

        <!-- Preview -->
        <div class="form-group">
          <div class="form-label">Preview</div>
          <div class="project-preview">
            <div 
              class="preview-indicator"
              style="background-color: {editColor}"
            >
              {#if editIcon}
                <span class="preview-icon">{editIcon}</span>
              {:else}
                <div class="preview-dot"></div>
              {/if}
            </div>
            <span class="preview-name">
              {editName || 'Project Name'}
            </span>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            onclick={handleClose}
            disabled={isUpdating}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            class="btn btn-primary"
            disabled={!editName.trim() || isUpdating}
          >
            {#if isUpdating}
              <span class="loading-spinner"></span>
              Updating...
            {:else}
              Update Project
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.75rem;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 0;
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .close-btn {
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
  }

  .close-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .edit-form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .error-message {
    padding: 0.75rem;
    background: var(--nord11);
    color: var(--nord0);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    text-align: center;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nord6);
  }

  .form-input,
  .form-textarea {
    padding: 0.75rem;
    border: 1px solid var(--nord3);
    border-radius: 0.375rem;
    background: var(--nord1);
    color: var(--nord6);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--nord8);
    box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 4rem;
  }

  .icon-suggestions {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.25rem;
    margin-top: 0.5rem;
  }

  .icon-suggestion {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--nord3);
    border-radius: 0.25rem;
    background: var(--nord1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .icon-suggestion:hover,
  .icon-suggestion.selected {
    border-color: var(--nord8);
    background: var(--nord8);
    color: var(--nord0);
  }

  .color-options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .color-option {
    width: 3rem;
    height: 2rem;
    border: 2px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .color-option:hover,
  .color-option.selected {
    border-color: var(--nord6);
    transform: scale(1.05);
  }

  .project-preview {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--nord3);
    border-radius: 0.375rem;
    background: var(--nord1);
  }

  .preview-indicator {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-icon {
    font-size: 1rem;
  }

  .preview-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
  }

  .preview-name {
    font-weight: 500;
    color: var(--nord6);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--nord3);
    color: var(--nord6);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--nord4);
  }

  .btn-primary {
    background: var(--nord8);
    color: var(--nord0);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--nord9);
    transform: translateY(-1px);
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .modal-content {
      margin: 0.5rem;
      max-width: none;
    }

    .modal-header,
    .edit-form {
      padding: 1rem;
    }

    .icon-suggestions {
      grid-template-columns: repeat(6, 1fr);
    }

    .color-options {
      grid-template-columns: repeat(3, 1fr);
    }

    .form-actions {
      flex-direction: column;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .btn,
    .close-btn,
    .icon-suggestion,
    .color-option,
    .loading-spinner {
      transition: none;
      animation: none;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .modal-content {
      border-width: 2px;
    }

    .form-input,
    .form-textarea,
    .icon-suggestion {
      border-width: 2px;
    }

    .color-option {
      border-width: 3px;
    }
  }
</style>