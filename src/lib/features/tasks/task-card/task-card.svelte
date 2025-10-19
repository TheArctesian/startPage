<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import TaskCardDisplay from './task-card-display.svelte';
  import TaskCardActions from './task-card-actions.svelte';
  import TaskCardDraggable from './task-card-draggable.svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let variant: 'compact' | 'detailed' | 'kanban' = 'detailed';
  export let selectable: boolean = false;
  export let selected: boolean = false;
  export let showTimer: boolean = true;
  export let showProject: boolean = false;
  export let draggable: boolean = false;
  
  // Permission props
  export let canEdit: boolean = false;
  export let isAuthenticated: boolean = false;

  // Callback props
  export let onEdit: ((task: TaskWithDetails) => void) | undefined = undefined;
  export let onDelete: ((task: TaskWithDetails) => void) | undefined = undefined;
  export let onStatusChange: ((task: TaskWithDetails, status: string) => void) | undefined = undefined;

  // Mobile detection
  let isMobile = false;

  const MOBILE_BREAKPOINT = 640;

  onMount(() => {
    isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const handleResize = () => {
      isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const dispatch = createEventDispatcher<{
    select: { task: TaskWithDetails };
    edit: { task: TaskWithDetails };
    complete: { task: TaskWithDetails };
    delete: { task: TaskWithDetails };
    move: { task: TaskWithDetails; newStatus: 'todo' | 'in_progress' | 'done' };
    dragstart: { task: TaskWithDetails; event: DragEvent };
    dragend: { task: TaskWithDetails; event: DragEvent };
  }>();

  function handleSelect(event: CustomEvent) {
    dispatch('select', event.detail);
  }

  function handleEdit(event: CustomEvent) {
    dispatch('edit', event.detail);
  }

  function handleDelete(event: CustomEvent) {
    dispatch('delete', event.detail);
  }

  function handleMove(event: CustomEvent) {
    dispatch('move', event.detail);
  }

  function handleDragStart(event: CustomEvent) {
    dispatch('dragstart', event.detail);
  }

  function handleDragEnd(event: CustomEvent) {
    dispatch('dragend', event.detail);
  }
</script>

<TaskCardDraggable
  {task}
  {draggable}
  {selectable}
  on:select={handleSelect}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
>
  <div class="task-card" class:selected>
    <TaskCardDisplay 
      {task} 
      {variant} 
      {showProject} 
      {selected}
    />
    
    <TaskCardActions
      {task}
      {canEdit}
      {isAuthenticated}
      {showTimer}
      {isMobile}
      {onEdit}
      {onDelete}
      {onStatusChange}
      on:edit={handleEdit}
      on:delete={handleDelete}
      on:move={handleMove}
    />
  </div>
</TaskCardDraggable>

<style>
  .task-card {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .task-card.selected {
    outline: 2px solid var(--nord8);
    outline-offset: 1px;
  }
</style>
