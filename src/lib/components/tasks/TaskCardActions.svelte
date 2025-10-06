<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import TimerButton from '$lib/components/timer/TimerButton.svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let canEdit: boolean = false;
  export let isAuthenticated: boolean = false;
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
  {#if showTimer && isAuthenticated}
    <div class="timer-section">
      <TimerButton taskId={task.id} />
    </div>
  {/if}

  <!-- Status change buttons (mobile) -->
  {#if isMobile && isAuthenticated}
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
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
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  .status-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    justify-content: center;
  }

  .start-btn {
    background: var(--nord8);
    color: var(--nord6);
  }

  .start-btn:hover {
    background: var(--nord7);
  }

  .complete-btn {
    background: var(--nord14);
    color: var(--nord6);
  }

  .complete-btn:hover {
    background: var(--nord13);
  }

  .pause-btn {
    background: var(--nord12);
    color: var(--nord6);
  }

  .pause-btn:hover {
    background: var(--nord11);
  }

  .restart-btn {
    background: var(--nord9);
    color: var(--nord6);
  }

  .restart-btn:hover {
    background: var(--nord8);
  }

  .edit-actions {
    display: flex;
    gap: 0.25rem;
    margin-left: auto;
  }

  .task-actions.mobile .edit-actions {
    margin-left: 0;
    justify-content: center;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--nord2);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .task-actions.mobile .action-btn {
    padding: 0.75rem 1rem;
    flex: 1;
    justify-content: center;
  }

  .action-btn:hover {
    background: var(--nord4);
    color: var(--nord0);
  }

  .delete-btn:hover {
    background: var(--nord11);
    color: var(--nord6);
  }
</style>