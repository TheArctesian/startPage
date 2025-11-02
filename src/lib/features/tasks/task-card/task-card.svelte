<script lang="ts">
  import { onMount } from 'svelte';
  import TaskCardDisplay from './task-card-display.svelte';
  import TaskCardActions from './task-card-actions.svelte';
  import TaskCardDraggable from './task-card-draggable.svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  let {
    task,
    variant = 'detailed',
    selectable = false,
    selected = false,
    showTimer = true,
    showProject = false,
    draggable = false,
    canEdit = false,
    isAuthenticated = false,
    onEdit = undefined,
    onDelete = undefined,
    onStatusChange = undefined,
    onselect,
    onedit,
    ondelete,
    onmove,
    ondragstart,
    ondragend
  } = $props<{
    task: TaskWithDetails;
    variant?: 'compact' | 'detailed' | 'kanban';
    selectable?: boolean;
    selected?: boolean;
    showTimer?: boolean;
    showProject?: boolean;
    draggable?: boolean;
    canEdit?: boolean;
    isAuthenticated?: boolean;
    onEdit?: (task: TaskWithDetails) => void;
    onDelete?: (task: TaskWithDetails) => void;
    onStatusChange?: (task: TaskWithDetails, status: string) => void;
    onselect?: (event: { task: TaskWithDetails }) => void;
    onedit?: (event: { task: TaskWithDetails }) => void;
    ondelete?: (event: { task: TaskWithDetails }) => void;
    onmove?: (event: { task: TaskWithDetails; newStatus: 'todo' | 'in_progress' | 'done' }) => void;
    ondragstart?: (event: { task: TaskWithDetails; event: DragEvent }) => void;
    ondragend?: (event: { task: TaskWithDetails; event: DragEvent }) => void;
  }>();

  // Mobile detection
  let isMobile = $state(false);

  const MOBILE_BREAKPOINT = 640;

  onMount(() => {
    isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const handleResize = () => {
      isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  function handleSelect(detail: { task: TaskWithDetails }) {
    onselect?.(detail);
  }

  function handleEdit(detail: { task: TaskWithDetails }) {
    onedit?.(detail);
  }

  function handleDelete(detail: { task: TaskWithDetails }) {
    ondelete?.(detail);
  }

  function handleMove(detail: { task: TaskWithDetails; newStatus: 'todo' | 'in_progress' | 'done' }) {
    onmove?.(detail);
  }

  function handleDragStart(detail: { task: TaskWithDetails; event: DragEvent }) {
    ondragstart?.(detail);
  }

  function handleDragEnd(detail: { task: TaskWithDetails; event: DragEvent }) {
    ondragend?.(detail);
  }
</script>

<TaskCardDraggable
  {task}
  {draggable}
  {selectable}
  onselect={handleSelect}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
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
      onedit={handleEdit}
      ondelete={handleDelete}
      onmove={handleMove}
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
