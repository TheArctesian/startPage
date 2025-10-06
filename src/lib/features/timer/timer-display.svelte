<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ActiveTimer } from '$lib/types/timer';

  export let timer: ActiveTimer;
  export let variant: 'compact' | 'detailed' = 'detailed';
  export let showControls = true;

  let displayTime = '00:00';
  let interval: NodeJS.Timeout | null = null;

  // Calculate and format elapsed time
  function updateDisplay() {
    if (!timer) return;
    
    const now = new Date();
    const elapsed = timer.pausedAt 
      ? timer.elapsedSeconds
      : timer.elapsedSeconds + Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
    
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    if (hours > 0) {
      displayTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Start the update interval
  function startInterval() {
    if (interval) return;
    interval = setInterval(updateDisplay, 1000);
  }

  // Stop the update interval
  function stopInterval() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  // Update when timer changes
  $: if (timer) {
    updateDisplay();
    if (timer.isRunning && !timer.pausedAt) {
      startInterval();
    } else {
      stopInterval();
    }
  }

  onMount(() => {
    updateDisplay();
    if (timer?.isRunning && !timer.pausedAt) {
      startInterval();
    }
  });

  onDestroy(() => {
    stopInterval();
  });

  // Format estimated time remaining
  function getEstimatedRemaining(): string {
    if (!timer.task?.estimatedMinutes) return '';
    
    const estimatedSeconds = timer.task.estimatedMinutes * 60;
    const elapsedSeconds = timer.elapsedSeconds;
    const remaining = Math.max(0, estimatedSeconds - elapsedSeconds);
    
    const minutes = Math.floor(remaining / 60);
    if (remaining <= 0) return 'overtime';
    if (minutes < 1) return '<1m left';
    return `${minutes}m left`;
  }

  // Calculate progress percentage
  function getProgress(): number {
    if (!timer.task?.estimatedMinutes) return 0;
    
    const estimatedSeconds = timer.task.estimatedMinutes * 60;
    const elapsedSeconds = timer.elapsedSeconds;
    
    return Math.min((elapsedSeconds / estimatedSeconds) * 100, 100);
  }
</script>

<div class="timer-display" class:compact={variant === 'compact'}>
  <!-- Time Display -->
  <div class="time-section">
    <div 
      class="time-text" 
      class:pulsing={timer.isRunning && !timer.pausedAt}
      class:paused={timer.pausedAt}
    >
      {displayTime}
    </div>
    
    {#if variant === 'detailed' && timer.task?.estimatedMinutes}
      <div class="time-meta">
        <span class="estimated-remaining">{getEstimatedRemaining()}</span>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            style="width: {getProgress()}%"
          ></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Task Info (detailed view only) -->
  {#if variant === 'detailed' && timer.task}
    <div class="task-section">
      <div class="task-title">{timer.task.title}</div>
      
      <div class="task-meta">
        {#if timer.task.estimatedMinutes}
          <span class="estimated-time">{timer.task.estimatedMinutes}m estimated</span>
        {/if}
        
        {#if timer.task.estimatedIntensity}
          <div class="intensity-dots">
            {#each Array(5) as _, i}
              <span 
                class="dot" 
                class:filled={i < timer.task.estimatedIntensity}
              ></span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Status Indicator -->
  <div class="status-indicator">
    {#if timer.pausedAt}
      <span class="status-icon paused" title="Paused">⏸</span>
    {:else if timer.isRunning}
      <span class="status-icon running" title="Running">▶</span>
    {:else}
      <span class="status-icon stopped" title="Stopped">⏹</span>
    {/if}
  </div>
</div>

<style>
  .timer-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 40px;
  }

  .timer-display.compact {
    gap: 0.5rem;
  }

  .time-section {
    flex: 1;
    min-width: 0;
  }

  .time-text {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--nord6);
    line-height: 1;
  }

  .compact .time-text {
    font-size: 1rem;
  }

  .time-text.pulsing {
    animation: pulse 2s ease-in-out infinite;
  }

  .time-text.paused {
    color: var(--nord13);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .time-meta {
    margin-top: 0.25rem;
  }

  .estimated-remaining {
    font-size: 0.75rem;
    color: var(--nord9);
    display: block;
    margin-bottom: 0.25rem;
  }

  .progress-bar {
    width: 100%;
    height: 3px;
    background: var(--nord3);
    border-radius: 1.5px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--nord14), var(--nord13));
    border-radius: 1.5px;
    transition: width 0.3s ease;
  }

  .task-section {
    flex: 2;
    min-width: 0;
  }

  .task-title {
    font-weight: 500;
    color: var(--nord6);
    font-size: 0.875rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 2px;
  }

  .task-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--nord4);
  }

  .estimated-time {
    color: var(--nord9);
  }

  .intensity-dots {
    display: flex;
    gap: 0.125rem;
  }

  .dot {
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background: var(--nord3);
    transition: background-color 0.2s ease;
  }

  .dot.filled {
    background: var(--nord8);
  }

  .status-indicator {
    flex-shrink: 0;
  }

  .status-icon {
    display: inline-block;
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .status-icon.running {
    color: var(--nord14);
    opacity: 1;
  }

  .status-icon.paused {
    color: var(--nord13);
    opacity: 1;
  }

  .status-icon.stopped {
    color: var(--nord4);
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .timer-display {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .time-text {
      text-align: center;
      font-size: 1.25rem;
    }

    .task-title {
      text-align: center;
    }

    .task-meta {
      justify-content: center;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .time-text {
      color: var(--nord6);
      font-weight: 700;
    }

    .progress-bar {
      border: 1px solid var(--nord4);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .time-text.pulsing {
      animation: none;
    }

    .progress-fill {
      transition: none;
    }
  }
</style>