<script lang="ts">
  import Icon from '$lib/ui/icon.svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  interface Props {
    task: TaskWithDetails;
    canEdit?: boolean;
    isAuthenticated?: boolean;
    isMobile?: boolean;
    onEdit?: ((task: TaskWithDetails) => void) | undefined;
    onDelete?: ((task: TaskWithDetails) => void) | undefined;
    onStatusChange?: ((task: TaskWithDetails, status: string) => void) | undefined;
    onedit?: (event: { task: TaskWithDetails }) => void;
    ondelete?: (event: { task: TaskWithDetails }) => void;
    onmove?: (event: { task: TaskWithDetails; newStatus: 'todo' | 'in_progress' | 'done' }) => void;
  }

  let {
    task,
    canEdit = false,
    isAuthenticated = false,
    isMobile = false,
    onEdit = undefined,
    onDelete = undefined,
    onStatusChange = undefined,
    onedit,
    ondelete,
    onmove
  }: Props = $props();

  function handleEdit() {
    if (onEdit) {
      onEdit(task);
    } else {
      onedit?.({ task });
    }
  }

  function handleDelete() {
    if (onDelete) {
      onDelete(task);
    } else {
      ondelete?.({ task });
    }
  }

  function handleStatusChange(newStatus: 'todo' | 'in_progress' | 'done') {
    if (onStatusChange) {
      onStatusChange(task, newStatus);
    } else {
      onmove?.({ task, newStatus });
    }
  }

  function moveTask(newStatus: 'todo' | 'in_progress' | 'done') {
    handleStatusChange(newStatus);
  }
</script>

<div class="task-actions" class:mobile={isMobile}>
  <!-- Edit/Delete buttons -->
  {#if canEdit && isAuthenticated}
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
    justify-content: flex-end !important;
    gap: 0.35rem !important;
    margin-top: 0.75rem !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .task-actions.mobile {
    flex-direction: column;
    align-items: stretch !important;
    gap: 0.75rem !important;
  }

  .edit-actions {
    display: flex !important;
    gap: 0.35rem !important;
    flex-shrink: 0 !important;
  }

  .task-actions.mobile .edit-actions {
    justify-content: center !important;
    width: 100% !important;
  }

  .action-btn {
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    padding: 0.4rem !important;
    border: 1px solid transparent !important;
    border-radius: 999px !important;
    background: transparent !important;
    color: var(--nord5, #e5e9f0) !important;
    cursor: pointer !important;
    transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease, transform 0.2s ease !important;
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
    border-radius: 10px !important;
    border-color: rgba(136, 192, 208, 0.18) !important;
    background: rgba(67, 76, 94, 0.55) !important;
    color: var(--nord6, #eceff4) !important;
  }

  .action-btn:hover {
    background: rgba(136, 192, 208, 0.16) !important;
    border-color: rgba(136, 192, 208, 0.35) !important;
    color: var(--nord6, #eceff4) !important;
    transform: translateY(-1px) !important;
  }

  .action-btn:focus-visible {
    border-color: var(--nord8, #88c0d0) !important;
    box-shadow: 0 0 0 2px rgba(136, 192, 208, 0.25) !important;
  }

  .edit-btn {
    color: var(--nord6, #eceff4) !important;
  }

  .delete-btn {
    color: var(--nord11, #bf616a) !important;
  }

  .delete-btn:hover {
    background: rgba(191, 97, 106, 0.18) !important;
    border-color: rgba(191, 97, 106, 0.45) !important;
    color: var(--nord6, #eceff4) !important;
  }
</style>
