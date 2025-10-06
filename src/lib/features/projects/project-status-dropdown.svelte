<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { ProjectStatus } from '$lib/types/database';

  export let currentStatus: ProjectStatus;

  const dispatch = createEventDispatcher<{
    change: { status: ProjectStatus };
    close: void;
  }>();

  let dropdownElement: HTMLDivElement;

  const statusOptions: { value: ProjectStatus; label: string; icon: string; color: string }[] = [
    {
      value: 'active',
      label: 'Active',
      icon: '●',
      color: 'var(--nord14)'
    },
    {
      value: 'done',
      label: 'Done',
      icon: '✓',
      color: 'var(--nord8)'
    },
    {
      value: 'archived',
      label: 'Archived',
      icon: '📦',
      color: 'var(--nord4)'
    }
  ];

  function handleStatusSelect(status: ProjectStatus) {
    if (status !== currentStatus) {
      dispatch('change', { status });
    }
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      dispatch('close');
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div 
  class="status-dropdown"
  bind:this={dropdownElement}
  role="menu"
  aria-label="Change project status"
>
  {#each statusOptions as option (option.value)}
    <button
      class="status-option"
      class:current={option.value === currentStatus}
      onclick={() => handleStatusSelect(option.value)}
      role="menuitem"
      style="--option-color: {option.color}"
    >
      <span class="option-icon">{option.icon}</span>
      <span class="option-label">{option.label}</span>
      {#if option.value === currentStatus}
        <span class="current-indicator">✓</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .status-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.375rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 8rem;
    padding: 0.25rem;
    margin-top: 0.25rem;
  }

  .status-option {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--nord6);
    cursor: pointer;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    text-align: left;
  }

  .status-option:hover {
    background: var(--nord2);
  }

  .status-option.current {
    background: var(--nord8);
    color: var(--nord0);
  }

  .option-icon {
    font-size: 0.75rem;
    color: var(--option-color);
    width: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-option.current .option-icon {
    color: var(--nord0);
  }

  .option-label {
    flex: 1;
    font-weight: 500;
  }

  .current-indicator {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  /* Animation */
  .status-dropdown {
    animation: slideDown 0.15s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-0.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>