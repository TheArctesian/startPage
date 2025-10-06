<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import TimerDisplay from './TimerDisplay.svelte';
  import Icon from '../ui/Icon.svelte';
  import type { ActiveTimer } from '$lib/types/timer';

  export let timers: ActiveTimer[];
  export let selectedTimerId: string | null;

  const dispatch = createEventDispatcher<{
    selectTimer: { timerId: string };
    stopTimer: { timerId: string };
    pauseTimer: { timerId: string };
    resumeTimer: { timerId: string };
    addManualTime: { timerId?: string };
    openHistory: { projectId?: number; taskId?: number };
  }>();

  // Calculate total time across all timers
  function getTotalElapsed(): string {
    const totalSeconds = timers.reduce((sum, timer) => {
      const now = new Date();
      const elapsed = timer.pausedAt 
        ? timer.elapsedSeconds
        : timer.elapsedSeconds + Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      return sum + elapsed;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m total`;
    } else {
      return `${minutes}m total`;
    }
  }

  function handleTimerAction(action: string, timerId: string) {
    switch (action) {
      case 'select':
        dispatch('selectTimer', { timerId });
        break;
      case 'stop':
        dispatch('stopTimer', { timerId });
        break;
      case 'pause':
        dispatch('pauseTimer', { timerId });
        break;
      case 'resume':
        dispatch('resumeTimer', { timerId });
        break;
      case 'addTime':
        dispatch('addManualTime', { timerId });
        break;
      case 'addManualTimeGeneral':
        dispatch('addManualTime', {});
        break;
      case 'history':
        const timer = timers.find(t => t.id === timerId);
        dispatch('openHistory', { 
          projectId: timer?.projectId, 
          taskId: timer?.task?.id 
        });
        break;
    }
  }
</script>

<div class="multi-timer-panel">
  <!-- Panel Header -->
  <div class="panel-header">
    <div class="header-info">
      <h3 class="panel-title">Active Timers</h3>
      <span class="total-time">{getTotalElapsed()}</span>
    </div>
  </div>

  <!-- Timer List -->
  <div class="timer-list">
    {#each timers as timer (timer.id)}
      <div 
        class="timer-item"
        class:selected={timer.id === selectedTimerId}
        in:fly={{ x: -20, duration: 200 }}
        out:fly={{ x: 20, duration: 200 }}
      >
        <!-- Timer Display -->
        <div 
          class="timer-content"
          on:click={() => handleTimerAction('select', timer.id)}
          role="button"
          tabindex="0"
          aria-label="Select timer for {timer.task?.title || 'Unknown task'}"
        >
          <TimerDisplay {timer} variant="detailed" showControls={false} />
        </div>

        <!-- Timer Controls -->
        <div class="timer-controls">
          {#if timer.pausedAt}
            <!-- Resume Button -->
            <button
              class="control-btn resume-btn"
              on:click={() => handleTimerAction('resume', timer.id)}
              title="Resume timer"
              aria-label="Resume timer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="control-icon">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </button>
          {:else if timer.isRunning}
            <!-- Pause Button -->
            <button
              class="control-btn pause-btn"
              on:click={() => handleTimerAction('pause', timer.id)}
              title="Pause timer"
              aria-label="Pause timer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="control-icon">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          {/if}

          <!-- Stop Button -->
          <button
            class="control-btn stop-btn"
            on:click={() => handleTimerAction('stop', timer.id)}
            title="Stop timer"
            aria-label="Stop timer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="control-icon">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>

          <!-- History Button -->
          <button
            class="control-btn history-btn"
            on:click={() => handleTimerAction('history', timer.id)}
            title="View time history"
            aria-label="View time history"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="control-icon">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </button>

          <!-- Add Manual Time Button -->
          <button
            class="control-btn add-time-btn"
            on:click={() => handleTimerAction('addTime', timer.id)}
            title="Add manual time"
            aria-label="Add manual time"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="control-icon">
              <path d="M12 2v20m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Panel Footer -->
  {#if timers.length > 0}
    <div class="panel-footer">
      <div class="footer-stats">
        <span class="running-count">
          {timers.filter(t => t.isRunning && !t.pausedAt).length} running
        </span>
        <span class="paused-count">
          {timers.filter(t => t.pausedAt).length} paused
        </span>
      </div>
      
      <div class="footer-actions">
        <button 
          class="footer-action-btn add-manual-btn"
          on:click={() => handleTimerAction('addManualTimeGeneral', '')}
          title="Add manual time entry"
        >
          <Icon name="plus" size={14} />
          Add Time
        </button>
        
        <button 
          class="footer-action-btn history-btn"
          on:click={() => dispatch('openHistory', {})}
          title="View all time history"
        >
          <Icon name="clock" size={14} />
          History
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .multi-timer-panel {
    padding: 0;
    max-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--nord3);
    background: rgba(76, 86, 106, 0.3);
  }

  .header-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .total-time {
    font-size: 0.75rem;
    color: var(--nord9);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .timer-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .timer-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--nord3);
    transition: background-color 0.2s ease;
    cursor: pointer;
  }

  .timer-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .timer-item.selected {
    background: rgba(129, 161, 193, 0.1);
    border-left: 3px solid var(--nord8);
  }

  .timer-item:last-child {
    border-bottom: none;
  }

  .timer-content {
    flex: 1;
    min-width: 0;
    padding-right: 0.75rem;
  }

  .timer-controls {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .control-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--nord4);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .control-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .control-btn:active {
    transform: scale(0.9);
  }

  .control-icon {
    width: 14px;
    height: 14px;
  }

  .resume-btn:hover,
  .resume-btn:focus {
    color: var(--nord14);
  }

  .pause-btn:hover,
  .pause-btn:focus {
    color: var(--nord13);
  }

  .stop-btn:hover,
  .stop-btn:focus {
    color: var(--nord11);
  }

  .history-btn:hover,
  .history-btn:focus {
    color: var(--nord7);
  }

  .add-time-btn:hover,
  .add-time-btn:focus {
    color: var(--nord8);
  }

  .panel-footer {
    padding: 8px 16px;
    border-top: 1px solid var(--nord3);
    background: rgba(67, 76, 94, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--nord4);
  }

  .footer-actions {
    display: flex;
    gap: 0.5rem;
  }

  .footer-action-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--nord3);
    background: transparent;
    color: var(--nord4);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .footer-action-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
    border-color: var(--nord4);
  }

  .add-manual-btn:hover {
    color: var(--nord14);
    border-color: var(--nord14);
  }

  .running-count {
    color: var(--nord14);
  }

  .paused-count {
    color: var(--nord13);
  }

  /* Scrollbar styling */
  .timer-list::-webkit-scrollbar {
    width: 4px;
  }

  .timer-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .timer-list::-webkit-scrollbar-thumb {
    background: var(--nord3);
    border-radius: 2px;
  }

  .timer-list::-webkit-scrollbar-thumb:hover {
    background: var(--nord4);
  }

  /* Accessibility */
  .timer-content:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .control-btn:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 1px;
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .timer-item {
      border-bottom: 2px solid var(--nord4);
    }

    .timer-item.selected {
      border-left: 4px solid var(--nord8);
      background: var(--nord1);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .timer-item,
    .control-btn {
      transition: none;
    }
  }
</style>