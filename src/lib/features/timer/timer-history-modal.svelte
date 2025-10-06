<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { scale, fade } from 'svelte/transition';
  import Icon from '$lib/ui/icon.svelte';
  import TimerHistory from './timer-history.svelte';

  export let isOpen = false;
  export let projectId: number | null = null;
  export let taskId: number | null = null;
  export let title = 'Timer History';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Focus management
  let modalElement: HTMLElement;
  
  function focusModal() {
    if (modalElement) {
      modalElement.focus();
    }
  }

  $: if (isOpen && modalElement) {
    focusModal();
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="modal-backdrop"
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
    role="presentation"
  >
    <!-- Modal Container -->
    <div 
      class="modal-container"
      in:scale={{ duration: 300, start: 0.95 }}
      out:scale={{ duration: 200, start: 0.95 }}
      bind:this={modalElement}
      tabindex="-1"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      on:keydown={handleKeydown}
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">
          <Icon name="clock" size={20} />
          {title}
          {#if projectId || taskId}
            <span class="filter-indicator">
              {#if taskId}(Task){/if}
              {#if projectId && !taskId}(Project){/if}
            </span>
          {/if}
        </h2>
        
        <button 
          class="close-btn"
          on:click={closeModal}
          title="Close"
          aria-label="Close timer history"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <TimerHistory 
          {projectId} 
          {taskId} 
          limit={50}
          showActions={true}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-container {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 12px;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(129, 161, 193, 0.1);
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--nord3);
    background: var(--nord1);
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .filter-indicator {
    font-size: 0.75rem;
    color: var(--nord4);
    font-weight: 400;
    background: var(--nord2);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--nord4);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .close-btn:active {
    transform: scale(0.95);
  }

  .modal-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-container {
      max-height: 95vh;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-title {
      font-size: 1.125rem;
      gap: 0.5rem;
    }

    .filter-indicator {
      font-size: 0.6875rem;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .modal-container {
      border: 2px solid var(--nord6);
    }

    .close-btn {
      border: 1px solid var(--nord4);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .modal-container,
    .close-btn {
      transition: none;
    }
  }

  /* Focus management */
  .modal-container:focus {
    outline: none;
  }

  .close-btn:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }
</style>