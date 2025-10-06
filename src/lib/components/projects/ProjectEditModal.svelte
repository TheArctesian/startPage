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
  let editColor = '--nord8';
  let editParentId: string | number | null = null;
  let isPrivate = false;
  let isUpdating = false;
  let errorMessage = '';
  let availableParents: ProjectWithDetails[] = [];
  let loadingParents = false;
  
  // Permission state
  let projectUsers: any[] = [];
  let loadingUsers = false;
  let allUsers: any[] = [];
  let showAddUserInput = false;
  let newUserEmail = '';
  let newUserPermission = 'view_only';

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

  // Load project permissions and users
  async function loadProjectPermissions() {
    if (!project) return;
    
    loadingUsers = true;
    try {
      // Load project users
      const usersResponse = await fetch(`/api/projects/${project.id}/users`);
      if (usersResponse.ok) {
        projectUsers = await usersResponse.json();
      }
      
      // Load all users for adding new permissions
      const allUsersResponse = await fetch('/api/users');
      if (allUsersResponse.ok) {
        allUsers = await allUsersResponse.json();
      }
    } catch (error) {
      console.error('Failed to load project permissions:', error);
    } finally {
      loadingUsers = false;
    }
  }

  // Add user permission
  async function addUserPermission() {
    if (!project || !newUserEmail.trim()) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: newUserEmail.trim(),
          permissionLevel: newUserPermission
        })
      });
      
      if (response.ok) {
        newUserEmail = '';
        newUserPermission = 'view_only';
        showAddUserInput = false;
        await loadProjectPermissions();
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Failed to add user permission';
      }
    } catch (error) {
      console.error('Failed to add user permission:', error);
      errorMessage = 'Failed to add user permission';
    }
  }

  // Update user permission
  async function updateUserPermission(userId: number, newPermission: string) {
    if (!project) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionLevel: newPermission })
      });
      
      if (response.ok) {
        await loadProjectPermissions();
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Failed to update user permission';
      }
    } catch (error) {
      console.error('Failed to update user permission:', error);
      errorMessage = 'Failed to update user permission';
    }
  }

  // Remove user permission
  async function removeUserPermission(userId: number) {
    if (!project) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadProjectPermissions();
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Failed to remove user permission';
      }
    } catch (error) {
      console.error('Failed to remove user permission:', error);
      errorMessage = 'Failed to remove user permission';
    }
  }

  // Reset form when modal opens
  $: if (isOpen && project) {
    editName = project.name;
    editDescription = project.description || '';
    editColor = project.color || '--nord8';
    editParentId = project.parentId || '';
    isPrivate = !project.isPublic;
    errorMessage = '';
    loadAvailableParents();
    loadProjectPermissions();
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
        color: editColor,
        parentId: cleanParentId,
        isPublic: !isPrivate
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

        <!-- Privacy Setting -->
        <div class="form-group">
          <div class="privacy-section">
            <div class="privacy-control">
              <label class="privacy-label" for="edit-project-privacy">
                <input
                  bind:checked={isPrivate}
                  id="edit-project-privacy"
                  type="checkbox"
                  class="privacy-checkbox"
                />
                <span class="checkmark"></span>
                Private Project
              </label>
              <div class="privacy-info" title="Private projects are only visible to you and users you invite">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9,9h6v2H9V9z M12,17h0.01"/>
                </svg>
              </div>
            </div>
            <div class="privacy-description">
              {#if isPrivate}
                <span class="privacy-text private">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Only you and invited users can see this project
                </span>
              {:else}
                <span class="privacy-text public">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  All users can see this project
                </span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Project Permissions -->
        {#if isPrivate}
          <div class="form-group">
            <div class="permissions-section">
              <div class="permissions-header">
                <div class="form-label">Project Access</div>
                <button
                  type="button"
                  class="add-user-btn"
                  onclick={() => showAddUserInput = !showAddUserInput}
                  disabled={loadingUsers}
                >
                  {showAddUserInput ? 'Cancel' : '+ Add User'}
                </button>
              </div>

              {#if showAddUserInput}
                <div class="add-user-form">
                  <div class="add-user-inputs">
                    <input
                      bind:value={newUserEmail}
                      type="email"
                      placeholder="User email address"
                      class="form-input"
                    />
                    <select bind:value={newUserPermission} class="form-input permission-select">
                      <option value="view_only">View Only</option>
                      <option value="editor">Editor</option>
                      <option value="project_admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    class="btn btn-primary add-user-submit"
                    onclick={addUserPermission}
                    disabled={!newUserEmail.trim()}
                  >
                    Add
                  </button>
                </div>
              {/if}

              <div class="users-list">
                {#if loadingUsers}
                  <div class="loading-users">Loading users...</div>
                {:else if projectUsers.length === 0}
                  <div class="no-users">No users have access to this project yet.</div>
                {:else}
                  {#each projectUsers as user (user.id)}
                    <div class="user-item">
                      <div class="user-info">
                        <div class="user-name">{user.username}</div>
                        <div class="user-email">{user.email || 'No email'}</div>
                      </div>
                      <div class="user-actions">
                        <select
                          value={user.permissionLevel}
                          onchange={(e) => updateUserPermission(user.id, e.target.value)}
                          class="permission-select-small"
                        >
                          <option value="view_only">View Only</option>
                          <option value="editor">Editor</option>
                          <option value="project_admin">Admin</option>
                        </select>
                        <button
                          type="button"
                          class="remove-user-btn"
                          onclick={() => removeUserPermission(user.id)}
                          title="Remove user access"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- Preview -->
        <div class="form-group">
          <div class="form-label">Preview</div>
          <div class="project-preview">
            <div 
              class="preview-indicator"
              style="background-color: {editColor}"
            >
              <div class="preview-dot"></div>
            </div>
            <span class="preview-name">
              {editName || 'Project Name'}
            </span>
            {#if isPrivate}
              <div class="preview-privacy" title="Private project">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            {/if}
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

  .preview-privacy {
    color: var(--nord12);
    opacity: 0.7;
    margin-left: auto;
  }

  /* Privacy section styles */
  .privacy-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .privacy-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .privacy-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nord6);
  }

  .privacy-checkbox {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--nord3);
    border-radius: 0.25rem;
    background: var(--nord0);
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }

  .privacy-checkbox:checked {
    background: var(--nord8);
    border-color: var(--nord8);
  }

  .privacy-checkbox:checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0.5rem;
    height: 0.5rem;
    background: white;
    border-radius: 0.125rem;
  }

  .privacy-checkbox:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  .privacy-info {
    color: var(--nord4);
    cursor: help;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .privacy-info:hover {
    opacity: 1;
  }

  .privacy-description {
    margin-left: 1.75rem;
  }

  .privacy-text {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid;
    transition: all 0.2s ease;
  }

  .privacy-text.private {
    color: var(--nord12);
    background: rgba(235, 203, 139, 0.1);
    border-color: rgba(235, 203, 139, 0.2);
  }

  .privacy-text.public {
    color: var(--nord14);
    background: rgba(163, 190, 140, 0.1);
    border-color: rgba(163, 190, 140, 0.2);
  }

  /* Permissions section styles */
  .permissions-section {
    border: 1px solid var(--nord3);
    border-radius: 0.5rem;
    padding: 1rem;
    background: var(--nord1);
  }

  .permissions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .add-user-btn {
    padding: 0.375rem 0.75rem;
    background: var(--nord8);
    color: var(--nord0);
    border: none;
    border-radius: 0.25rem;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-user-btn:hover:not(:disabled) {
    background: var(--nord9);
  }

  .add-user-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-user-form {
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.375rem;
  }

  .add-user-inputs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .add-user-inputs .form-input {
    flex: 1;
  }

  .permission-select {
    min-width: 120px;
  }

  .add-user-submit {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .loading-users,
  .no-users {
    text-align: center;
    color: var(--nord4);
    font-style: italic;
    padding: 1rem;
  }

  .user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.375rem;
  }

  .user-info {
    flex: 1;
  }

  .user-name {
    font-weight: 500;
    color: var(--nord6);
    font-size: 0.875rem;
  }

  .user-email {
    font-size: 0.75rem;
    color: var(--nord4);
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .permission-select-small {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--nord3);
    border-radius: 0.25rem;
    background: var(--nord1);
    color: var(--nord6);
    font-size: 0.75rem;
  }

  .remove-user-btn {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    color: var(--nord11);
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .remove-user-btn:hover {
    background: rgba(191, 97, 106, 0.1);
    color: var(--nord11);
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
    .form-textarea {
      border-width: 2px;
    }

    .color-option {
      border-width: 3px;
    }
  }
</style>