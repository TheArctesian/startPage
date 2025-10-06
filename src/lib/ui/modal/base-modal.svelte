<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Icon from '../icon.svelte';

  export let isOpen: boolean = false;
  export let title: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  export let closable: boolean = true;
  export let closeOnBackdrop: boolean = true;
  export let closeOnEscape: boolean = true;

  const dispatch = createEventDispatcher<{
    close: void;
    open: void;
  }>();

  function close() {
    if (closable) {
      isOpen = false;
      dispatch('close');
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape') {
      close();
    }
  }

  onMount(() => {
    if (isOpen) {
      dispatch('open');
    }
  });

  $: if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  $: modalSizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl', 
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }[size];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div 
    class="modal-backdrop"
    onclick={handleBackdropClick}
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="modal-container {modalSizeClass}"
      transition:fly={{ y: 50, duration: 300, easing: quintOut }}
    >
      <!-- Header -->
      {#if title || closable}
        <div class="modal-header">
          {#if title}
            <h2 class="modal-title">{title}</h2>
          {/if}
          
          {#if closable}
            <button 
              class="modal-close-btn"
              onclick={close}
              title="Close"
            >
              <Icon name="x" size={16} />
            </button>
          {/if}
        </div>
      {/if}

      <!-- Body -->
      <div class="modal-body">
        <slot />
      </div>

      <!-- Footer -->
      {#if $$slots.footer}
        <div class="modal-footer">
          <slot name="footer" />
        </div>
      {/if}
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-container {
    background: var(--nord6);
    border: 1px solid var(--nord4);
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-height: 90vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 0 1.5rem;
    border-bottom: 1px solid var(--nord4);
    background: var(--nord5);
    border-radius: 12px 12px 0 0;
  }

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord0);
    padding-bottom: 1rem;
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: var(--nord2);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close-btn:hover {
    background: var(--nord4);
    color: var(--nord0);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid var(--nord4);
    background: var(--nord5);
    border-radius: 0 0 12px 12px;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-container {
      max-height: 95vh;
    }

    .modal-header,
    .modal-body,
    .modal-footer {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .modal-title {
      font-size: 1.125rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .modal-container {
      background: var(--nord0);
      border-color: var(--nord2);
    }

    .modal-header,
    .modal-footer {
      background: var(--nord1);
      border-color: var(--nord2);
    }

    .modal-title {
      color: var(--nord6);
    }
  }
</style>