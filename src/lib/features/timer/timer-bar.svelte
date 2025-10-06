<script lang="ts">
  import { activeTimers, newSelectedTimerId as selectedTimerId, TimerManager } from '$lib/stores';
  import TimerDisplay from './timer-display.svelte';
  import { fly } from 'svelte/transition';
  import type { ActiveTimer } from '$lib/types/timer';

  // Reactive values
  $: hasActiveTimers = $activeTimers.length > 0;
  $: selectedTimer = $activeTimers.find(t => t.id === $selectedTimerId) || $activeTimers[0];

  // Calculate total time across all timers
  function getTotalElapsed(): string {
    const totalSeconds = $activeTimers.reduce((sum, timer) => {
      const now = new Date();
      const elapsed = timer.pausedAt 
        ? timer.elapsedSeconds
        : timer.elapsedSeconds + Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      return sum + elapsed;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  function cycleTimer() {
    if ($activeTimers.length > 1) {
      const currentIndex = $activeTimers.findIndex(t => t.id === $selectedTimerId);
      const nextIndex = (currentIndex + 1) % $activeTimers.length;
      selectedTimerId.set($activeTimers[nextIndex].id);
    }
  }

  function pauseResumeTimer() {
    if (selectedTimer) {
      if (selectedTimer.pausedAt) {
        TimerManager.resumeTimer(selectedTimer.id);
      } else {
        TimerManager.pauseTimer(selectedTimer.id);
      }
    }
  }

  function stopTimer() {
    if (selectedTimer) {
      TimerManager.stopTimer(selectedTimer.id);
    }
  }
</script>

{#if hasActiveTimers}
  <div 
    class="timer-bar"
    in:fly={{ y: -20, duration: 300 }}
    out:fly={{ y: -20, duration: 200 }}
  >
    <div class="timer-bar-content">
      <!-- Main Timer Display -->
      <div class="main-timer">
        {#if selectedTimer}
          <TimerDisplay timer={selectedTimer} variant="compact" showControls={false} />
        {/if}
      </div>

      <!-- Timer Summary -->
      <div class="timer-summary">
        {#if $activeTimers.length === 1}
          <span class="summary-text">1 active timer</span>
        {:else}
          <span class="summary-text">{$activeTimers.length} active • {getTotalElapsed()} total</span>
        {/if}
      </div>

      <!-- Timer Controls -->
      <div class="timer-controls">
        {#if $activeTimers.length > 1}
          <button 
            class="control-btn cycle-btn"
            on:click={cycleTimer}
            title="Cycle through timers"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="control-icon">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
        {/if}
        
        <button 
          class="control-btn pause-resume-btn"
          on:click={pauseResumeTimer}
          title={selectedTimer?.pausedAt ? 'Resume timer' : 'Pause timer'}
        >
          {#if selectedTimer?.pausedAt}
            <svg viewBox="0 0 24 24" fill="currentColor" class="control-icon">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor" class="control-icon">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          {/if}
        </button>

        <button 
          class="control-btn stop-btn"
          on:click={stopTimer}
          title="Stop timer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="control-icon">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .timer-bar {
    background: var(--nord1);
    border-bottom: 1px solid var(--nord3);
    padding: 0.75rem 1.5rem;
    z-index: 30;
  }

  .timer-bar-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .main-timer {
    flex: 1;
    min-width: 0;
    max-width: 300px;
  }

  .timer-summary {
    flex-shrink: 0;
  }

  .summary-text {
    font-size: 0.875rem;
    color: var(--nord4);
    font-weight: 500;
  }

  .timer-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-shrink: 0;
  }

  .control-btn {
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

  .control-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .control-btn:active {
    transform: scale(0.95);
  }

  .control-icon {
    width: 16px;
    height: 16px;
  }

  .cycle-btn:hover {
    color: var(--nord7);
  }

  .pause-resume-btn:hover {
    color: var(--nord13);
  }

  .stop-btn:hover {
    color: var(--nord11);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .timer-bar {
      padding: 0.5rem 1rem;
    }

    .timer-bar-content {
      gap: 0.75rem;
    }

    .main-timer {
      max-width: 200px;
    }

    .summary-text {
      font-size: 0.8rem;
    }

    .control-btn {
      width: 28px;
      height: 28px;
    }

    .control-icon {
      width: 14px;
      height: 14px;
    }
  }

  @media (max-width: 480px) {
    .timer-summary {
      display: none;
    }

    .timer-bar-content {
      gap: 0.5rem;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .timer-bar {
      border-bottom: 2px solid var(--nord4);
    }

    .control-btn {
      border: 1px solid var(--nord3);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .control-btn {
      transition: none;
    }
  }
</style>