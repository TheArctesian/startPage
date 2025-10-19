<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '$lib/ui/icon.svelte';
  import { isAuthenticated as isAuthenticatedStore, canEdit as canEditStore } from '$lib/stores/user-state';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let canEdit: boolean = false;
  export let isAuthenticated: boolean = false;

  // Use centralized state if props not explicitly set
  $: actualCanEdit = canEdit || $canEditStore;
  $: actualIsAuthenticated = isAuthenticated || $isAuthenticatedStore;
  export let isMobile: boolean = false;

  export let onEdit: ((task: TaskWithDetails) => void) | undefined = undefined;
  export let onDelete: ((task: TaskWithDetails) => void) | undefined = undefined;
  export let onStatusChange: ((task: TaskWithDetails, status: string) => void) | undefined = undefined;

  const dispatch = createEventDispatcher<{
    edit: { task: TaskWithDetails };
    delete: { task: TaskWithDetails };
    complete: { task: TaskWithDetails };
    move: { task: TaskWithDetails; newStatus: 'todo' | 'in_progress' | 'done' };
  }>();

  function handleEdit() {
    if (onEdit) {
      onEdit(task);
    } else {
      dispatch('edit', { task });
    }
  }

  function handleDelete() {
    if (onDelete) {
      onDelete(task);
    } else {
      dispatch('delete', { task });
    }
  }

  function handleStatusChange(newStatus: 'todo' | 'in_progress' | 'done') {
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    } else {
      dispatch('move', { task, newStatus });
    }
  }

  function moveTask(newStatus: 'todo' | 'in_progress' | 'done') {
    handleStatusChange(newStatus);
  }
</script>

<div class="task-actions" class:mobile={isMobile}>
  <!-- Edit/Delete buttons -->
  {#if actualCanEdit && actualIsAuthenticated}
    <div class="edit-actions">
      <button 
        class="action-btn edit-btn"
        onclick={handleEdit}
        title="Edit task"
      >
        <Icon name="edit" size="sm" />
        {#if isMobile}<span>Edit</span>{/if}
      </button>
      
      <button 
        class="action-btn delete-btn"
        onclick={handleDelete}
        title="Delete task"
      >
        <Icon name="trash" size="sm" />
        {#if isMobile}<span>Delete</span>{/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .task-actions {
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    margin-top: 0.5rem !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .task-actions.mobile {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .edit-actions {
    display: flex !important;
    gap: 0.25rem !important;
    margin-left: auto !important;
    flex-shrink: 0 !important;
  }

  .task-actions.mobile .edit-actions {
    margin-left: 0;
    justify-content: center;
  }

  .action-btn {
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    padding: 0.5rem !important;
    border: 1px solid var(--nord3, #4c566a) !important;
    border-radius: 4px !important;
    background: var(--nord2, #434c5e) !important;
    color: var(--nord6, #eceff4) !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    appearance: none !important;
    text-decoration: none !important;
    outline: none !important;
    box-sizing: border-box !important;
    font-family: inherit !important;
    line-height: inherit !important;
    min-height: 2rem !important;
  }

  /* Ensure icons render properly in action buttons */
  :global(.action-btn svg) {
    display: inline-block !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
    stroke: currentColor !important;
    fill: none !important;
  }

  .task-actions.mobile .action-btn {
    padding: 0.75rem 1rem !important;
    flex: 1 !important;
    justify-content: center !important;
    min-height: 2.5rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
  }

  .action-btn:hover {
    background: var(--nord3, #4c566a);
    color: var(--nord6, #eceff4);
    border-color: var(--nord8, #88c0d0);
  }

  .delete-btn:hover {
    background: var(--nord11, #bf616a);
    color: var(--nord6, #eceff4);
    border-color: var(--nord11, #bf616a);
  }
</style>