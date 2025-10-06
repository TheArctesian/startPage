<script lang="ts">
  import { activeTimers, TimerManager } from '$lib/stores';
  import TimerDisplay from './TimerDisplay.svelte';
  import { formatTime } from '$lib/utils/time';
  import type { ActiveTimer } from '$lib/types/timer';

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

  function handleTimerAction(action: string, timerId: string) {
    switch (action) {
      case 'pause':
        TimerManager.pauseTimer(timerId);
        break;
      case 'resume':
        TimerManager.resumeTimer(timerId);
        break;
      case 'stop':
        TimerManager.stopTimer(timerId);
        break;
    }
  }
</script>

{#if $activeTimers.length > 0}
  <section class="active-timers-section">
    <div class="section-header">
      <h2 class="section-title">Active Timers</h2>
      <div class="section-meta">
        <span class="timer-count">{$activeTimers.length}</span>
        <span class="total-time">{getTotalElapsed()} total</span>
      </div>
    </div>

    <div class="timers-grid">
      {#each $activeTimers as timer (timer.id)}
        <div class="timer-card">
          <!-- Timer Display -->
          <div class="timer-content">
            <TimerDisplay {timer} variant="detailed" showControls={false} />
          </div>

          <!-- Timer Actions -->
          <div class="timer-actions">
            {#if timer.pausedAt}
              <button
                class="action-btn resume-btn"
                on:click={() => handleTimerAction('resume', timer.id)}
                title="Resume timer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
                  <polygon points="8,5 19,12 8,19" />
                </svg>
                Resume
              </button>
            {:else if timer.isRunning}
              <button
                class="action-btn pause-btn"
                on:click={() => handleTimerAction('pause', timer.id)}
                title="Pause timer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                Pause
              </button>
            {/if}

            <button
              class="action-btn stop-btn"
              on:click={() => handleTimerAction('stop', timer.id)}
              title="Stop timer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop
            </button>
          </div>

          <!-- Project Info -->
          {#if timer.task?.project}
            <div class="project-info">
              <div
                class="project-color-dot"
                style="background-color: {timer.task.project.color || 'var(--nord4)'}"
              ></div>
              <span class="project-name">{timer.task.project.name}</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .active-timers-section {
    margin: 2rem 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--nord3);
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .section-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.875rem;
  }

  .timer-count {
    background: var(--nord8);
    color: var(--nord0);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-weight: 600;
    min-width: 1.5rem;
    text-align: center;
  }

  .total-time {
    color: var(--nord4);
    font-weight: 500;
  }

  .timers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1rem;
  }

  .timer-card {
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 0.75rem;
    padding: 1.25rem;
    transition: all 0.2s ease;
    position: relative;
  }

  .timer-card:hover {
    border-color: var(--nord8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .timer-content {
    margin-bottom: 1rem;
  }

  .timer-actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--nord3);
    background: var(--nord0);
    color: var(--nord4);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .action-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .action-icon {
    width: 14px;
    height: 14px;
  }

  .resume-btn:hover {
    color: var(--nord14);
    border-color: var(--nord14);
  }

  .pause-btn:hover {
    color: var(--nord13);
    border-color: var(--nord13);
  }

  .stop-btn:hover {
    color: var(--nord11);
    border-color: var(--nord11);
  }

  .project-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--nord3);
  }

  .project-color-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .project-name {
    font-size: 0.8rem;
    color: var(--nord4);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .timers-grid {
      grid-template-columns: 1fr;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .section-meta {
      gap: 0.75rem;
    }

    .timer-card {
      padding: 1rem;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .timer-card {
      border-width: 2px;
    }

    .action-btn {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .timer-card,
    .action-btn {
      transition: none;
    }
  }
</style>