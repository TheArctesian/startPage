<script lang="ts">
  import type { TaskWithDetails } from '$lib/types/database';
  import type { Snippet } from 'svelte';

  let {
    task,
    draggable = false,
    selectable = false,
    onselect,
    ondragstart,
    ondragend,
    onclick,
    children
  } = $props<{
    task: TaskWithDetails;
    draggable?: boolean;
    selectable?: boolean;
    onselect?: (event: { task: TaskWithDetails }) => void;
    ondragstart?: (event: { task: TaskWithDetails; event: DragEvent }) => void;
    ondragend?: (event: { task: TaskWithDetails; event: DragEvent }) => void;
    onclick?: (event: { task: TaskWithDetails; event: MouseEvent }) => void;
    children?: Snippet;
  }>();

  function handleClick(event: MouseEvent) {
    if (selectable) {
      onselect?.({ task });
    }
    onclick?.({ task, event });
  }

  function handleDragStart(event: DragEvent) {
    if (!draggable) return;
    
    event.dataTransfer?.setData('text/plain', task.id.toString());
    ondragstart?.({ task, event });
  }

  function handleDragEnd(event: DragEvent) {
    if (!draggable) return;
    
    ondragend?.({ task, event });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (selectable) {
        onselect?.({ task });
      }
    }
  }
</script>

<div
  class="task-card-draggable"
  class:draggable
  class:selectable
  {draggable}
  role={selectable ? "button" : undefined}
  tabindex={selectable ? 0 : undefined}
  onclick={handleClick}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  onkeydown={handleKeyDown}
>
  {@render children?.()}
</div>

<style>
  .task-card-draggable {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .task-card-draggable.selectable {
    cursor: pointer;
  }

  .task-card-draggable.draggable {
    cursor: grab;
  }

  .task-card-draggable.draggable:active {
    cursor: grabbing;
  }

  .task-card-draggable:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .task-card-draggable:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  .task-card-draggable:active {
    transform: translateY(0);
  }

  /* Dragging state */
  .task-card-draggable:global(.dragging) {
    opacity: 0.5;
    transform: rotate(5deg);
    z-index: 1000;
  }
</style>
