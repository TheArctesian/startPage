<!--
  Task Completion Modal
  
  Collects actual intensity rating when a task is completed.
  Follows UNIX philosophy: single responsibility for task completion flow.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IntensityPicker from '$lib/components/ui/IntensityPicker.svelte';
  import type { TaskWithDetails } from '$lib/types/database';

  export let isOpen = false;
  export let task: TaskWithDetails | null = null;

  const dispatch = createEventDispatcher<{
    complete: { task: TaskWithDetails; actualIntensity: number; timeSpent?: number };
    cancel: void;
  }>();

  let actualIntensity = 3; // Default to medium intensity
  let timeSpent: number | null = null;
  let reflection = '';
  let isSubmitting = false;

  // Reset form when task changes
  $: if (task) {
    actualIntensity = task.estimatedIntensity || 3;
    timeSpent = null;
    reflection = '';
    isSubmitting = false;
  }

  function handleSubmit() {
    if (!task) return;
    
    isSubmitting = true;
    
    dispatch('complete', {
      task,
      actualIntensity,
      timeSpent: timeSpent || undefined
    });
    
    handleClose();
  }

  function handleClose() {
    isSubmitting = false;
    dispatch('cancel');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isSubmitting) {
      handleClose();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }

  // Calculate time difference if task has start time
  $: estimatedMinutes = task?.estimatedMinutes || 0;
  $: actualMinutesDisplay = timeSpent || 0;
  $: timeDifference = actualMinutesDisplay - estimatedMinutes;
  $: timeAccuracy = estimatedMinutes > 0 ? 
    Math.round((1 - Math.abs(timeDifference) / estimatedMinutes) * 100) : 0;

  // Calculate intensity accuracy
  $: intensityDifference = Math.abs(actualIntensity - (task?.estimatedIntensity || 3));
  $: intensityAccuracy = Math.round((1 - intensityDifference / 4) * 100);
</script>

{#if isOpen && task}
  <div 
    class="completion-modal"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="completion-title"
    tabindex="-1"
  >
    <div class="completion-content">
      <!-- Header -->
      <div class="completion-header">
        <h2 id="completion-title" class="completion-title">
          Task Completed! 🎉
        </h2>
        <button 
          class="close-btn"
          onclick={handleClose}
          disabled={isSubmitting}
          aria-label="Cancel completion"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="completion-body">
        <!-- Task Info -->
        <div class="task-summary">
          <h3 class="task-title">{task.title}</h3>
          <div class="task-estimates">
            <div class="estimate-item">
              <span class="estimate-label">Estimated:</span>
              <span class="estimate-value">
                {estimatedMinutes}min • Intensity {task.estimatedIntensity}/5
              </span>
            </div>
          </div>
        </div>

        <!-- Time Spent Input -->
        <div class="form-field">
          <label for="time-spent" class="form-label">
            How long did this actually take? (minutes)
          </label>
          <input
            id="time-spent"
            type="number"
            min="1"
            max="999"
            bind:value={timeSpent}
            placeholder="Enter actual minutes"
            class="form-input"
            disabled={isSubmitting}
          />
          {#if timeSpent && estimatedMinutes > 0}
            <div class="time-feedback" class:over={timeDifference > 0} class:under={timeDifference < 0}>
              {#if timeDifference > 0}
                <span class="feedback-icon">⏰</span>
                <span>{timeDifference} minutes over estimate</span>
              {:else if timeDifference < 0}
                <span class="feedback-icon">⚡</span>
                <span>{Math.abs(timeDifference)} minutes under estimate</span>
              {:else}
                <span class="feedback-icon">🎯</span>
                <span>Perfect estimate!</span>
              {/if}
              <span class="accuracy-score">({timeAccuracy}% accurate)</span>
            </div>
          {/if}
        </div>

        <!-- Actual Intensity -->
        <div class="form-field">
          <label for="actual-intensity" class="form-label">
            How intense was this task actually?
          </label>
          <div class="intensity-section">
            <IntensityPicker 
              bind:value={actualIntensity}
              disabled={isSubmitting}
            />
            <div class="intensity-feedback">
              {#if actualIntensity !== task.estimatedIntensity}
                <div class="intensity-diff">
                  {#if actualIntensity > task.estimatedIntensity}
                    <span class="feedback-icon">📈</span>
                    <span>More intense than expected</span>
                  {:else}
                    <span class="feedback-icon">📉</span>
                    <span>Less intense than expected</span>
                  {/if}
                  <span class="accuracy-score">({intensityAccuracy}% accurate)</span>
                </div>
              {:else}
                <div class="intensity-match">
                  <span class="feedback-icon">🎯</span>
                  <span>Intensity matched expectation!</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Optional Reflection -->
        <div class="form-field">
          <label for="reflection" class="form-label">
            Any reflections? (optional)
          </label>
          <textarea
            id="reflection"
            bind:value={reflection}
            placeholder="What went well? What could be improved?"
            class="form-textarea"
            rows="3"
            disabled={isSubmitting}
          ></textarea>
        </div>

        <!-- Completion Summary -->
        {#if timeSpent && actualIntensity}
          <div class="completion-summary">
            <h4 class="summary-title">Completion Summary</h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Time Accuracy:</span>
                <span class="summary-value" class:high={timeAccuracy >= 80} class:medium={timeAccuracy >= 60 && timeAccuracy < 80} class:low={timeAccuracy < 60}>
                  {timeAccuracy}%
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Intensity Accuracy:</span>
                <span class="summary-value" class:high={intensityAccuracy >= 80} class:medium={intensityAccuracy >= 60 && intensityAccuracy < 80} class:low={intensityAccuracy < 60}>
                  {intensityAccuracy}%
                </span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="completion-footer">
        <button 
          class="btn-cancel"
          onclick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          class="btn-complete"
          onclick={handleSubmit}
          disabled={isSubmitting || !timeSpent}
        >
          {#if isSubmitting}
            <span class="loading-spinner"></span>
            Completing...
          {:else}
            Complete Task
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .completion-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(46, 52, 64, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    padding: var(--space-md);
    backdrop-filter: blur(4px);
  }

  .completion-content {
    background: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
  }

  .completion-header {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
  }

  .completion-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: var(--font-size-lg);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal);
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover:not(:disabled) {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  .close-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .completion-body {
    flex: 1;
    padding: var(--space-lg);
    overflow-y: auto;
  }

  .task-summary {
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin-bottom: var(--space-lg);
    border: 1px solid var(--border-default);
  }

  .task-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin: 0 0 var(--space-sm) 0;
  }

  .task-estimates {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .estimate-item {
    display: flex;
    gap: var(--space-sm);
  }

  .estimate-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .estimate-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .form-field {
    margin-bottom: var(--space-lg);
  }

  .form-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
  }

  .form-input,
  .form-textarea {
    width: 100%;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    transition: all var(--transition-normal);
    font-family: inherit;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--focus-ring);
    box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.1);
  }

  .form-input:disabled,
  .form-textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-textarea {
    resize: vertical;
    min-height: 4rem;
  }

  .time-feedback {
    margin-top: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .time-feedback.over {
    background: rgba(208, 135, 112, 0.1);
    border: 1px solid rgba(208, 135, 112, 0.3);
    color: var(--nord12);
  }

  .time-feedback.under {
    background: rgba(163, 190, 140, 0.1);
    border: 1px solid rgba(163, 190, 140, 0.3);
    color: var(--nord14);
  }

  .time-feedback:not(.over):not(.under) {
    background: rgba(136, 192, 208, 0.1);
    border: 1px solid rgba(136, 192, 208, 0.3);
    color: var(--nord8);
  }

  .intensity-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .intensity-feedback {
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
  }

  .intensity-diff {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background: rgba(235, 203, 139, 0.1);
    border: 1px solid rgba(235, 203, 139, 0.3);
    color: var(--nord13);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
  }

  .intensity-match {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background: rgba(163, 190, 140, 0.1);
    border: 1px solid rgba(163, 190, 140, 0.3);
    color: var(--nord14);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
  }

  .feedback-icon {
    font-size: 1rem;
  }

  .accuracy-score {
    margin-left: auto;
    font-weight: var(--font-weight-medium);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .completion-summary {
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    border: 1px solid var(--border-default);
  }

  .summary-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-md) 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .summary-label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }

  .summary-value.high {
    color: var(--nord14);
  }

  .summary-value.medium {
    color: var(--nord13);
  }

  .summary-value.low {
    color: var(--nord12);
  }

  .completion-footer {
    padding: var(--space-lg);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    background: var(--bg-secondary);
  }

  .btn-cancel,
  .btn-complete {
    padding: var(--space-sm) var(--space-lg);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .btn-cancel {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
  }

  .btn-cancel:hover:not(:disabled) {
    background: var(--hover-bg);
    color: var(--text-primary);
  }

  .btn-complete {
    background: var(--color-success);
    color: var(--nord0);
  }

  .btn-complete:hover:not(:disabled) {
    background: #8fb08a;
    transform: translateY(-1px);
  }

  .btn-cancel:disabled,
  .btn-complete:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
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

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .completion-modal {
      padding: var(--space-sm);
    }

    .completion-content {
      max-width: none;
      max-height: 95vh;
    }

    .completion-header,
    .completion-body,
    .completion-footer {
      padding: var(--space-md);
    }

    .summary-grid {
      grid-template-columns: 1fr;
      gap: var(--space-sm);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .completion-content {
      border-width: 2px;
    }

    .task-summary,
    .completion-summary {
      border-width: 2px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }

    .btn-complete:hover {
      transform: none;
    }
  }
</style>