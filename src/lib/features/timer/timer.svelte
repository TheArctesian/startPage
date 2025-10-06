<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    timerState, 
    timerDisplay, 
    isTimerRunning, 
    selectedTask,
    startTimer, 
    stopTimer,
    updateTimerElapsed,
    loadActiveTimer 
  } from '$lib/stores';
  import type { Task } from '$lib/types/database';

  // Timer update interval
  let interval: NodeJS.Timeout | null = null;

  // Component state
  let isStarting = false;
  let isStopping = false;

  // Reactive values
  $: currentTime = $timerDisplay;
  $: isActive = $isTimerRunning;
  $: currentTask = $selectedTask;

  // Start timer for specific task
  async function handleStart(task: Task) {
    if (isStarting) return;
    
    isStarting = true;
    try {
      await startTimer(task.id);
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      isStarting = false;
    }
  }

  // Stop current timer
  async function handleStop() {
    if (isStopping) return;
    
    isStopping = true;
    try {
      await stopTimer();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    } finally {
      isStopping = false;
    }
  }

  // Toggle timer (start if stopped, stop if running)
  export async function toggleTimer(task?: Task) {
    if (isActive) {
      await handleStop();
    } else if (task) {
      await handleStart(task);
    }
  }

  // Start timer update interval when active
  function startInterval() {
    if (interval) return;
    
    interval = setInterval(() => {
      updateTimerElapsed();
    }, 1000);
  }

  // Stop timer update interval
  function stopInterval() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  // Watch for timer state changes
  $: if (isActive) {
    startInterval();
  } else {
    stopInterval();
  }

  // Component lifecycle
  onMount(async () => {
    // Load any active timer on component mount
    await loadActiveTimer();
  });

  onDestroy(() => {
    stopInterval();
  });
</script>

{#if isActive || currentTask}
<div class="timer-display" class:active={isActive}>
  <!-- Time Display -->
  <div class="time-text" class:pulsing={isActive}>
    {currentTime}
  </div>

  <!-- Current Task Info -->
  {#if currentTask}
    <div class="task-info">
      <span class="task-title">{currentTask.title}</span>
      <div class="task-meta">
        <span class="estimated-time">{currentTask.estimatedMinutes}m estimated</span>
        <span class="intensity-dots">
          {#each Array(5) as _, i}
            <span 
              class="dot" 
              class:filled={i < currentTask.estimatedIntensity}
            ></span>
          {/each}
        </span>
      </div>
    </div>
  {:else if isActive}
    <div class="task-info">
      <span class="task-title">Timer Running</span>
      <div class="task-meta">
        <span class="estimated-time">No task selected</span>
      </div>
    </div>
  {/if}

  <!-- Control Buttons -->
  <div class="controls">
    {#if isActive}
      <button 
        class="btn btn-stop"
        onclick={handleStop}
        disabled={isStopping}
        title="Stop timer (Space)"
      >
        {isStopping ? '⏹' : '⏹'}
        <span class="sr-only">Stop Timer</span>
      </button>
    {:else if currentTask}
      <button 
        class="btn btn-start"
        onclick={() => handleStart(currentTask)}
        disabled={isStarting}
        title="Start timer (Space)"
      >
        {isStarting ? '⏳' : '▶'}
        <span class="sr-only">Start Timer</span>
      </button>
    {/if}
  </div>
</div>
{:else}
  <!-- Show a minimal timer when no task is selected -->
  <div class="timer-display timer-inactive">
    <div class="time-text">0:00</div>
    <div class="task-info">
      <span class="task-title">No active timer</span>
      <div class="task-meta">
        <span class="estimated-time">Click a task's timer button to start</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .timer-display {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: var(--nord0);
    border: 1px solid var(--nord3);
    transition: all 0.2s ease;
  }

  .timer-display.active {
    background: var(--nord1);
    border-color: var(--nord8);
    box-shadow: 0 0 0 1px var(--nord8);
  }

  .timer-display.timer-inactive {
    opacity: 0.7;
    background: var(--nord0);
  }

  .time-text {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord6);
    min-width: 4rem;
    text-align: center;
  }

  .time-text.pulsing {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .task-info {
    flex: 1;
    min-width: 0;
  }

  .task-title {
    display: block;
    font-weight: 500;
    color: var(--nord6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background: var(--nord3);
    transition: background-color 0.2s ease;
  }

  .dot.filled {
    background: var(--nord8);
  }

  .controls {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-start {
    background: var(--nord14);
    color: var(--nord0);
  }

  .btn-start:hover:not(:disabled) {
    background: var(--nord13);
    transform: translateY(-1px);
  }

  .btn-stop {
    background: var(--nord11);
    color: var(--nord6);
  }

  .btn-stop:hover:not(:disabled) {
    background: var(--nord12);
    transform: translateY(-1px);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .timer-display {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .time-text {
      font-size: 1.5rem;
    }

    .task-info {
      text-align: center;
    }

    .controls {
      justify-content: center;
    }
  }
</style>