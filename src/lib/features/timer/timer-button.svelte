<script lang="ts">
  import { TimerManager, activeTimers } from '$lib/stores';
  import type { Task } from '$lib/types/database';

  export let task: Task;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'primary' | 'minimal' = 'minimal';
  export let canEdit = false;

  let isLoading = false;

  // Check if this task has an active timer
  $: hasActiveTimer = $activeTimers.some(t => t.task?.id === task.id);
  $: activeTimer = $activeTimers.find(t => t.task?.id === task.id);
  $: isRunning = activeTimer?.isRunning && !activeTimer?.pausedAt;
  $: isPaused = activeTimer?.pausedAt !== null;

  async function handleTimerClick() {
    if (!canEdit || isLoading) return;

    isLoading = true;
    try {
      if (hasActiveTimer && activeTimer) {
        if (isPaused) {
          // Resume paused timer
          TimerManager.resumeTimer(activeTimer.id);
        } else if (isRunning) {
          // Pause running timer
          TimerManager.pauseTimer(activeTimer.id);
        } else {
          // Start timer (shouldn't happen but safety fallback)
          await TimerManager.startTimer(task);
        }
      } else {
        // Start new timer
        await TimerManager.startTimer(task);
      }
    } catch (error) {
      console.error('Timer action failed:', error);
    } finally {
      isLoading = false;
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  // Get button state and appearance
  function getButtonState() {
    if (isPaused) {
      return {
        icon: 'play',
        title: 'Resume timer',
        class: 'paused',
        color: 'var(--nord13)'
      };
    } else if (isRunning) {
      return {
        icon: 'pause',
        title: 'Pause timer',
        class: 'running',
        color: 'var(--nord14)'
      };
    } else {
      return {
        icon: 'play',
        title: 'Start timer',
        class: 'stopped',
        color: 'var(--nord4)'
      };
    }
  }

  $: buttonState = getButtonState();
</script>

{#if canEdit}
  <button
    class="timer-btn {variant} {sizeClasses[size]} {buttonState.class}"
    class:loading={isLoading}
    class:has-timer={hasActiveTimer}
    onclick={handleTimerClick}
    disabled={isLoading}
    title={buttonState.title}
    aria-label={buttonState.title}
  >
    {#if isLoading}
      <svg class="loading-spinner" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"/>
        <path d="M4 12a8 8 0 018-8V0" stroke="currentColor" stroke-width="4"/>
      </svg>
    {:else if buttonState.icon === 'play'}
      <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
        <polygon points="8,5 19,12 8,19" />
      </svg>
    {:else if buttonState.icon === 'pause'}
      <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    {/if}

    <!-- Active indicator dot -->
    {#if hasActiveTimer}
      <div 
        class="active-indicator"
        class:pulsing={isRunning}
        style="background-color: {buttonState.color}"
      ></div>
    {/if}
  </button>
{/if}

<style>
  .timer-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    color: var(--nord4);
  }

  .timer-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .timer-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .timer-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  /* Variant styles */
  .timer-btn.primary {
    background: var(--nord8);
    color: var(--nord0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .timer-btn.primary:hover:not(:disabled) {
    background: var(--nord9);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .timer-btn.minimal {
    background: transparent;
  }

  /* State-specific colors */
  .timer-btn.running {
    color: var(--nord14);
  }

  .timer-btn.running:hover:not(:disabled) {
    background: rgba(163, 190, 140, 0.2);
  }

  .timer-btn.paused {
    color: var(--nord13);
  }

  .timer-btn.paused:hover:not(:disabled) {
    background: rgba(235, 203, 139, 0.2);
  }

  .timer-btn.stopped:hover:not(:disabled) {
    color: var(--nord6);
  }

  .timer-btn.has-timer {
    background: rgba(129, 161, 193, 0.1);
    border: 1px solid rgba(129, 161, 193, 0.3);
  }

  .icon {
    width: 60%;
    height: 60%;
    transition: transform 0.2s ease;
  }

  .timer-btn:hover .icon {
    transform: scale(1.1);
  }

  .loading-spinner {
    width: 60%;
    height: 60%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .active-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 2px solid var(--nord0);
    z-index: 1;
  }

  .active-indicator.pulsing {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7;
      transform: scale(1.2);
    }
  }

  /* Size-specific adjustments */
  .h-6 .icon,
  .h-6 .loading-spinner {
    width: 50%;
    height: 50%;
  }

  .h-6 .active-indicator {
    width: 6px;
    height: 6px;
    top: -1px;
    right: -1px;
  }

  .h-10 .icon,
  .h-10 .loading-spinner {
    width: 65%;
    height: 65%;
  }

  .h-10 .active-indicator {
    width: 10px;
    height: 10px;
    top: -3px;
    right: -3px;
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .timer-btn {
      border: 1px solid transparent;
    }

    .timer-btn:focus {
      border-color: var(--nord8);
      outline: 2px solid var(--nord8);
      outline-offset: 1px;
    }

    .timer-btn.has-timer {
      border-color: var(--nord8);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .timer-btn,
    .icon,
    .active-indicator.pulsing {
      transition: none;
      animation: none;
    }
  }
</style>