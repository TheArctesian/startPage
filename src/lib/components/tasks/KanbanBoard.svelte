<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut, backOut } from 'svelte/easing';
  import TaskCard from './TaskCard.svelte';
  import TaskForm from './TaskForm.svelte';
  import { todoTasks, inProgressTasks, doneTasks, updateTask } from '$lib/stores';
  import type { TaskWithDetails, TaskStatus } from '$lib/types/database';

  const dispatch = createEventDispatcher<{
    taskSelect: { task: TaskWithDetails };
    taskEdit: { task: TaskWithDetails };
    taskComplete: { task: TaskWithDetails };
    taskDelete: { task: TaskWithDetails };
  }>();

  // Subscribe to all task stores at top level
  $: allTodoTasks = $todoTasks;
  $: allInProgressTasks = $inProgressTasks;
  $: allDoneTasks = $doneTasks;

  // Debug logging (remove after fixing)
  $: {
    console.log('📋 KanbanBoard - Todo tasks:', allTodoTasks.length);
    console.log('📋 KanbanBoard - In Progress tasks:', allInProgressTasks.length);
    console.log('📋 KanbanBoard - Done tasks:', allDoneTasks.length);
    if (allTodoTasks.length > 0) {
      console.log('📋 Sample todo task:', allTodoTasks[0]);
    }
  }

  // Column definitions
  const columns = [
    {
      id: 'todo' as TaskStatus,
      title: 'To Do',
      icon: '○',
      addButtonText: 'Add Task'
    },
    {
      id: 'in_progress' as TaskStatus,
      title: 'In Progress',
      icon: '◐',
      addButtonText: 'Start Task'
    },
    {
      id: 'done' as TaskStatus,
      title: 'Done',
      icon: '●',
      addButtonText: null // No add button for done column
    }
  ] as const;

  // Get tasks for column
  function getTasksForColumn(columnId: TaskStatus) {
    switch (columnId) {
      case 'todo': return allTodoTasks;
      case 'in_progress': return allInProgressTasks;
      case 'done': return allDoneTasks;
      default: return [];
    }
  }

  // Drag and drop state
  let draggedTask: TaskWithDetails | null = null;
  let draggedOverColumn: TaskStatus | null = null;
  let draggedOverIndex: number = -1;

  // Form state
  let isFormOpen = false;
  let editingTask: TaskWithDetails | null = null;

  // Handle task drag start
  function handleDragStart(task: TaskWithDetails, event: DragEvent) {
    draggedTask = task;
    event.dataTransfer?.setData('text/plain', task.id.toString());
    event.dataTransfer!.effectAllowed = 'move';
  }

  // Handle task drag end
  function handleDragEnd() {
    draggedTask = null;
    draggedOverColumn = null;
    draggedOverIndex = -1;
  }

  // Handle column drag over
  function handleColumnDragOver(event: DragEvent, columnId: TaskStatus) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    draggedOverColumn = columnId;
  }

  // Handle column drop
  async function handleColumnDrop(event: DragEvent, targetStatus: TaskStatus) {
    event.preventDefault();
    
    if (!draggedTask) return;

    // Don't update if dropping in same column
    if (draggedTask.status === targetStatus) {
      handleDragEnd();
      return;
    }

    try {
      await updateTask(draggedTask.id, { 
        status: targetStatus,
        boardColumn: targetStatus
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }

    handleDragEnd();
  }

  // Handle task card drop for reordering
  function handleTaskDrop(event: DragEvent, targetTask: TaskWithDetails, targetIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedTask || draggedTask.id === targetTask.id) {
      handleDragEnd();
      return;
    }

    // Handle status change and position reordering
    // For now, just update status - position ordering can be added later
    if (draggedTask.status !== targetTask.status) {
      updateTask(draggedTask.id, { 
        status: targetTask.status,
        boardColumn: targetTask.status
      });
    }

    handleDragEnd();
  }

  // Open form for new task
  function openNewTaskForm(status: TaskStatus = 'todo') {
    editingTask = null;
    isFormOpen = true;
  }

  // Open form for editing task
  function openEditTaskForm(task: TaskWithDetails) {
    editingTask = task;
    isFormOpen = true;
    dispatch('taskEdit', { task });
  }

  // Handle task form submit
  function handleTaskFormSubmit(event: CustomEvent<{ task: TaskWithDetails }>) {
    isFormOpen = false;
    editingTask = null;
  }

  // Handle task form cancel
  function handleTaskFormCancel() {
    isFormOpen = false;
    editingTask = null;
  }

  // Handle task selection
  function handleTaskSelect(task: TaskWithDetails) {
    dispatch('taskSelect', { task });
  }

  // Handle task completion
  function handleTaskComplete(task: TaskWithDetails) {
    dispatch('taskComplete', { task });
  }

  // Handle task deletion
  function handleTaskDelete(task: TaskWithDetails) {
    dispatch('taskDelete', { task });
  }

  // Format time display for better UX
  function formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  // Calculate column statistics
  function getColumnStats(tasks: TaskWithDetails[]) {
    const totalTasks = tasks.length;
    const totalTime = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
    
    return {
      count: totalTasks,
      time: totalTime,
      timeFormatted: formatTime(totalTime)
    };
  }
</script>

<div class="kanban-board">
  <!-- Board Header -->
  <div class="board-header">
    <h2 class="board-title">Task Board</h2>
    <button 
      class="btn btn-primary"
      onclick={() => openNewTaskForm()}
      title="Add new task (Cmd+N)"
    >
      + New Task
    </button>
  </div>

  <!-- Kanban Columns -->
  <div class="kanban-columns">
    {#each columns as column}
      {#key [allTodoTasks, allInProgressTasks, allDoneTasks]}
        {@const columnTasks = getTasksForColumn(column.id)}
        {@const stats = getColumnStats(columnTasks)}
        {#if typeof console !== 'undefined'}
          {@html console.log(`🔄 Column ${column.title} - columnTasks:`, columnTasks.length, columnTasks) || ''}
        {/if}
      
      <div 
        class="kanban-column column-{column.id}"
        class:drag-over={draggedOverColumn === column.id}
        ondragover={(e) => handleColumnDragOver(e, column.id)}
        ondrop={(e) => handleColumnDrop(e, column.id)}
      >
        <!-- Column Header -->
        <div class="column-header">
          <div class="column-title-row">
            <div class="column-title-left">
              <span class="column-icon">{column.icon}</span>
              <h3 class="column-name">{column.title}</h3>
            </div>
            <div class="column-stats-inline">
              <span class="task-count">{stats.count}</span>
              {#if stats.time > 0}
                <span class="time-estimate" title="Total estimated time">
                  {stats.timeFormatted}
                </span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Tasks List -->
        <div class="tasks-list">
          {#each columnTasks as task, index (task.id)}
            <div
              class="task-item kanban-task-card"
              class:moving={draggedTask?.id === task.id}
              animate:flip={{ duration: 400, easing: quintOut }}
              in:fly={{ x: -30, duration: 300, easing: backOut }}
              out:fly={{ x: 30, duration: 200, easing: quintOut }}
              ondrop={(e) => handleTaskDrop(e, task, index)}
              ondragover={(e) => e.preventDefault()}
            >
              <TaskCard
                {task}
                variant="kanban"
                selectable={true}
                draggable={true}
                showTimer={column.id !== 'done'}
                on:select={() => handleTaskSelect(task)}
                on:edit={() => openEditTaskForm(task)}
                on:complete={() => handleTaskComplete(task)}
                on:delete={() => handleTaskDelete(task)}
                on:dragstart={(e) => handleDragStart(task, e.detail.event)}
                on:dragend={handleDragEnd}
              />
            </div>
          {/each}

          <!-- Empty state -->
          {#if columnTasks.length === 0}
            <div 
              class="empty-column"
              in:scale={{ duration: 300, easing: backOut, start: 0.8 }}
              out:scale={{ duration: 200, easing: quintOut, start: 0.8 }}
            >
              <div class="empty-icon">{column.icon}</div>
              <p class="empty-text">No tasks in {column.title.toLowerCase()}</p>
              {#if column.addButtonText}
                <button 
                  class="btn btn-ghost btn-sm transition-all hover-scale active-press"
                  onclick={() => openNewTaskForm(column.id)}
                >
                  {column.addButtonText}
                </button>
              {/if}
            </div>
          {/if}

          <!-- Add Task Button (for non-empty columns) -->
          {#if column.addButtonText && columnTasks.length > 0}
            <button 
              class="add-task-btn transition-all hover-scale active-press"
              onclick={() => openNewTaskForm(column.id)}
              title="Add task to {column.title}"
            >
              + Add Task
            </button>
          {/if}
        </div>
      </div>
      {/key}
    {/each}
  </div>
</div>

<!-- Task Form Modal -->
<TaskForm
  bind:isOpen={isFormOpen}
  task={editingTask}
  on:submit={handleTaskFormSubmit}
  on:cancel={handleTaskFormCancel}
  on:close={handleTaskFormCancel}
/>

<style>
  .kanban-board {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--nord0);
    box-sizing: border-box;
  }

  .board-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
  }

  .board-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--nord6);
    margin: 0;
    letter-spacing: -0.025em;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .btn-primary {
    background: var(--nord8);
    color: var(--nord0);
  }

  .btn-primary:hover {
    background: var(--nord9);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(129, 161, 193, 0.3);
  }

  .btn-ghost {
    background: transparent;
    color: var(--nord4);
    border: 1px solid var(--nord3);
  }

  .btn-ghost:hover {
    background: var(--nord2);
    border-color: var(--nord4);
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .kanban-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 1.5rem;
    flex: 1;
    width: 100%;
    min-height: 0;
    height: 600px; /* Fixed height for proper layout */
    box-sizing: border-box;
  }

  .kanban-column {
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }

  .kanban-column.drag-over {
    border-color: var(--nord8);
    box-shadow: 0 0 0 2px rgba(129, 161, 193, 0.2);
  }

  /* Column-specific grid positioning and styling */
  .column-todo {
    grid-row: 1 / 3; /* Spans both rows (full height) */
    grid-column: 1;
    background: linear-gradient(135deg, var(--nord1) 0%, rgba(129, 161, 193, 0.03) 100%);
    border-color: rgba(129, 161, 193, 0.2);
  }

  .column-in_progress {
    grid-row: 1;
    grid-column: 2;
    background: linear-gradient(135deg, var(--nord1) 0%, rgba(235, 203, 139, 0.03) 100%);
    border-color: rgba(235, 203, 139, 0.2);
  }

  .column-done {
    grid-row: 2;
    grid-column: 2;
    background: linear-gradient(135deg, var(--nord1) 0%, rgba(163, 190, 140, 0.03) 100%);
    border-color: rgba(163, 190, 140, 0.2);
  }

  .column-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(10px);
  }

  .column-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .column-title-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .column-icon {
    font-size: 1.25rem;
    color: var(--nord4);
    font-weight: 400;
  }

  .column-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--nord6);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .column-stats-inline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .task-count {
    background: var(--nord2);
    color: var(--nord6);
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 0.25rem 0.625rem;
    border-radius: 1rem;
    min-width: 1.5rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--nord3);
  }

  .time-estimate {
    color: var(--nord8);
    background: rgba(129, 161, 193, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 0.8125rem;
  }

  .tasks-list {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .task-item {
    transition: transform 0.2s ease;
    width: 100%;
  }

  .empty-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem 1rem;
    color: var(--nord4);
    flex: 1;
  }

  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 0.875rem;
    margin: 0 0 1rem;
  }

  .add-task-btn {
    padding: 0.75rem;
    border: 2px dashed var(--nord3);
    border-radius: 0.375rem;
    background: transparent;
    color: var(--nord4);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 0.5rem;
  }

  .add-task-btn:hover {
    border-color: var(--nord8);
    color: var(--nord8);
    background: rgba(129, 161, 193, 0.05);
  }

  /* Responsive design */
  @media (max-width: 1024px) {
    .kanban-columns {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .kanban-column {
      min-height: 300px;
    }

    .board-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .board-title {
      text-align: center;
    }
  }

  @media (max-width: 640px) {
    .kanban-board {
      gap: 0.5rem;
    }

    .column-header {
      padding: 0.75rem;
    }

    .tasks-list {
      padding: 0.75rem;
    }

    .task-count {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
    }
  }

  /* Drag and drop visual feedback */
  .task-item:has(.task-card[draggable="true"]:hover) {
    transform: rotate(1deg);
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .kanban-column {
      border-width: 2px;
    }

    .column-header {
      border-bottom-width: 2px;
    }

    .add-task-btn {
      border-width: 3px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .kanban-column,
    .task-item,
    .btn,
    .add-task-btn {
      transition: none;
    }
  }

  /* Focus styles for accessibility */
  .btn:focus,
  .add-task-btn:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  /* Print styles */
  @media print {
    .board-header {
      page-break-after: avoid;
    }

    .kanban-columns {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .btn,
    .add-task-btn {
      display: none;
    }
  }
</style>