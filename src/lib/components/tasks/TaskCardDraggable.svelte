<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  export let task: TaskWithDetails;
  export let draggable: boolean = false;
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{
    select: { task: TaskWithDetails };
    dragstart: { task: TaskWithDetails; event: DragEvent };
    dragend: { task: TaskWithDetails; event: DragEvent };
    click: { task: TaskWithDetails; event: MouseEvent };
  }>();

  function handleClick(event: MouseEvent) {
    if (selectable) {
      dispatch('select', { task });
    }
    dispatch('click', { task, event });
  }

  function handleDragStart(event: DragEvent) {
    if (!draggable) return;
    
    event.dataTransfer?.setData('text/plain', task.id.toString());
    dispatch('dragstart', { task, event });
  }

  function handleDragEnd(event: DragEvent) {
    if (!draggable) return;
    
    dispatch('dragend', { task, event });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (selectable) {
        dispatch('select', { task });
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
  <slot />
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