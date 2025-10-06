<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '$lib/ui/icon.svelte';
  import TimerButton from '$lib/features/timer/timer-button.svelte';
  import { isAuthenticated as isAuthenticatedStore, canEdit as canEditStore } from '$lib/stores/user-state';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let canEdit: boolean = false;
  export let isAuthenticated: boolean = false;

  // Use centralized state if props not explicitly set
  $: actualCanEdit = canEdit || $canEditStore;
  $: actualIsAuthenticated = isAuthenticated || $isAuthenticatedStore;
  export let showTimer: boolean = true;
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
  <!-- Timer button -->
  {#if showTimer && actualIsAuthenticated}
    <div class="timer-section">
      <TimerButton {task} canEdit={actualCanEdit} />
    </div>
  {/if}

  <!-- Status change buttons (mobile) -->
  {#if isMobile && actualIsAuthenticated}
    <div class="mobile-status-buttons">
      {#if task.status === 'todo'}
        <button 
          class="status-btn start-btn"
          onclick={() => moveTask('in_progress')}
          title="Start task"
        >
          <Icon name="play" size="sm" />
          <span>Start</span>
        </button>
      {:else if task.status === 'in_progress'}
        <button 
          class="status-btn complete-btn"
          onclick={() => moveTask('done')}
          title="Complete task"
        >
          <Icon name="check" size="sm" />
          <span>Complete</span>
        </button>
        <button 
          class="status-btn pause-btn"
          onclick={() => moveTask('todo')}
          title="Pause task"
        >
          <Icon name="pause" size="sm" />
          <span>Pause</span>
        </button>
      {:else if task.status === 'done'}
        <button 
          class="status-btn restart-btn"
          onclick={() => moveTask('in_progress')}
          title="Restart task"
        >
          <Icon name="rotate-ccw" size="sm" />
          <span>Restart</span>
        </button>
      {/if}
    </div>
  {/if}

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

  .timer-section {
    display: flex;
    justify-content: flex-start;
  }

  .mobile-status-buttons {
    display: flex !important;
    gap: 0.5rem !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .status-btn {
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    padding: 0.75rem 1rem !important;
    border: none !important;
    border-radius: 6px !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    flex: 1 !important;
    justify-content: center !important;
    appearance: none !important;
    text-decoration: none !important;
    outline: none !important;
    box-sizing: border-box !important;
    font-family: inherit !important;
    line-height: inherit !important;
    min-height: 2.5rem !important;
  }

  /* Ensure icons render properly in status buttons */
  :global(.status-btn svg) {
    display: inline-block !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
    stroke: currentColor !important;
    fill: none !important;
  }

  .start-btn {
    background: var(--nord8, #88c0d0);
    color: var(--nord6, #eceff4);
  }

  .start-btn:hover {
    background: var(--nord7, #8fbcbb);
  }

  .complete-btn {
    background: var(--nord14, #a3be8c);
    color: var(--nord6, #eceff4);
  }

  .complete-btn:hover {
    background: var(--nord13, #ebcb8b);
  }

  .pause-btn {
    background: var(--nord12, #d08770);
    color: var(--nord6, #eceff4);
  }

  .pause-btn:hover {
    background: var(--nord11, #bf616a);
  }

  .restart-btn {
    background: var(--nord9, #81a1c1);
    color: var(--nord6, #eceff4);
  }

  .restart-btn:hover {
    background: var(--nord8, #88c0d0);
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