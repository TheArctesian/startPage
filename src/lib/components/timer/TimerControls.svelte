<script lang="ts">
  import { 
    isTimerRunning, 
    selectedTask, 
    startTimer, 
    stopTimer 
  } from '$lib/stores';
  import type { Task } from '$lib/types/database';

  export let task: Task | null = null;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'primary' | 'secondary' | 'minimal' = 'primary';

  // Component state
  let isLoading = false;

  // Use provided task or selected task
  $: currentTask = task || $selectedTask;
  $: isActive = $isTimerRunning;
  $: canStart = currentTask && !isActive && !isLoading;
  $: canStop = isActive && !isLoading;

  // Start timer
  async function handleStart() {
    if (!currentTask || isLoading) return;
    
    isLoading = true;
    try {
      await startTimer(currentTask.id);
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      isLoading = false;
    }
  }

  // Stop timer
  async function handleStop() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      await stopTimer();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    } finally {
      isLoading = false;
    }
  }

  // Toggle timer
  export async function toggle() {
    if (isActive) {
      await handleStop();
    } else {
      await handleStart();
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm', 
    lg: 'h-10 w-10 text-base'
  };

  // Variant classes
  const variantClasses = {
    primary: 'timer-btn-primary',
    secondary: 'timer-btn-secondary',
    minimal: 'timer-btn-minimal'
  };
</script>

<div class="timer-controls">
  {#if isActive}
    <!-- Stop Button -->
    <button
      class="timer-btn {variantClasses[variant]} {sizeClasses[size]}"
      onclick={handleStop}
      disabled={!canStop}
      title="Stop timer"
      aria-label="Stop timer"
    >
      {#if isLoading}
        <span class="loading-spinner"></span>
      {:else}
        <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      {/if}
    </button>
  {:else}
    <!-- Start Button -->
    <button
      class="timer-btn {variantClasses[variant]} {sizeClasses[size]}"
      onclick={handleStart}
      disabled={!canStart}
      title="Start timer"
      aria-label="Start timer"
    >
      {#if isLoading}
        <span class="loading-spinner"></span>
      {:else}
        <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      {/if}
    </button>
  {/if}
</div>

<style>
  .timer-controls {
    display: inline-flex;
  }

  .timer-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .timer-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .timer-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .timer-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  /* Primary variant - colorful */
  .timer-btn-primary {
    background: var(--nord14);
    color: var(--nord0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .timer-btn-primary:hover:not(:disabled) {
    background: var(--nord13);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /* Secondary variant - muted */
  .timer-btn-secondary {
    background: var(--nord3);
    color: var(--nord6);
    border: 1px solid var(--nord4);
  }

  .timer-btn-secondary:hover:not(:disabled) {
    background: var(--nord4);
    border-color: var(--nord5);
  }

  /* Minimal variant - subtle */
  .timer-btn-minimal {
    background: transparent;
    color: var(--nord8);
  }

  .timer-btn-minimal:hover:not(:disabled) {
    background: var(--nord2);
    color: var(--nord9);
  }

  .icon {
    width: 60%;
    height: 60%;
  }

  .loading-spinner {
    width: 60%;
    height: 60%;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Size-specific adjustments */
  .h-6 .icon,
  .h-6 .loading-spinner {
    width: 50%;
    height: 50%;
  }

  .h-10 .icon,
  .h-10 .loading-spinner {
    width: 65%;
    height: 65%;
  }
</style>