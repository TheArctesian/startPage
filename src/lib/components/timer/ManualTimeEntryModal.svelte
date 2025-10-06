<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { scale, fade } from 'svelte/transition';
  import Icon from '../ui/Icon.svelte';
  import type { Task, Project } from '$lib/types/database';
  import type { ManualTimeEntry } from '$lib/types/timer';

  export let isOpen = false;
  export let task: Task | null = null;
  export let project: Project | null = null;
  export let projects: Project[] = [];

  const dispatch = createEventDispatcher<{
    close: void;
    submit: { entry: ManualTimeEntry };
  }>();

  // Form state
  let selectedProjectId = project?.id || null;
  let selectedTaskId = task?.id || null;
  let description = '';
  let date = new Date().toISOString().split('T')[0]; // Today's date
  let startTime = '';
  let endTime = '';
  let duration = 0; // minutes
  let useDuration = false; // Toggle between time range and duration
  let intensity = 3; // 1-5 scale

  // Validation state
  let errors: Record<string, string> = {};
  let isSubmitting = false;

  // Available tasks for selected project
  let availableTasks: Task[] = [];

  // Reset form when modal opens/closes
  $: if (isOpen) {
    resetForm();
    loadTasksForProject();
  }

  // Load tasks when project changes
  $: if (selectedProjectId) {
    loadTasksForProject();
  }

  function resetForm() {
    selectedProjectId = project?.id || null;
    selectedTaskId = task?.id || null;
    description = '';
    date = new Date().toISOString().split('T')[0];
    startTime = '';
    endTime = '';
    duration = 0;
    useDuration = false;
    intensity = 3;
    errors = {};
    isSubmitting = false;
  }

  async function loadTasksForProject() {
    if (!selectedProjectId) {
      availableTasks = [];
      return;
    }

    try {
      const response = await fetch(`/api/tasks?project=${selectedProjectId}&status=all`);
      if (response.ok) {
        availableTasks = await response.json();
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      availableTasks = [];
    }
  }

  function validateForm(): boolean {
    errors = {};

    if (!selectedProjectId) {
      errors.project = 'Project is required';
    }

    if (!date) {
      errors.date = 'Date is required';
    }

    if (useDuration) {
      if (duration <= 0) {
        errors.duration = 'Duration must be greater than 0';
      }
    } else {
      if (!startTime) {
        errors.startTime = 'Start time is required';
      }
      if (!endTime) {
        errors.endTime = 'End time is required';
      }
      if (startTime && endTime && startTime >= endTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    if (intensity < 1 || intensity > 5) {
      errors.intensity = 'Intensity must be between 1 and 5';
    }

    return Object.keys(errors).length === 0;
  }

  function calculateDuration(): number {
    if (useDuration) {
      return duration;
    }

    if (!startTime || !endTime) return 0;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    
    // Handle cross-midnight sessions
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    isSubmitting = true;

    try {
      const calculatedDuration = calculateDuration();
      const startDateTime = useDuration 
        ? new Date(`${date}T${startTime || '12:00'}`)
        : new Date(`${date}T${startTime}`);
      
      const endDateTime = useDuration
        ? new Date(startDateTime.getTime() + calculatedDuration * 60000)
        : new Date(`${date}T${endTime}`);

      const entry: ManualTimeEntry = {
        taskId: selectedTaskId || null,
        projectId: selectedProjectId!,
        description: description.trim() || null,
        startTime: startDateTime,
        endTime: endDateTime,
        duration: calculatedDuration,
        intensity
      };

      dispatch('submit', { entry });
    } catch (error) {
      errors.general = 'Failed to create time entry';
    } finally {
      isSubmitting = false;
    }
  }

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Handle input changes manually to avoid cyclical dependency
  function handleStartTimeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    startTime = target.value;
    
    if (useDuration && duration > 0) {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(start.getTime() + duration * 60000);
      endTime = end.toTimeString().slice(0, 5);
    }
  }

  function handleEndTimeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    endTime = target.value;
    
    if (!useDuration && startTime) {
      duration = calculateDuration();
    }
  }

  function handleDurationChange(event: Event) {
    const target = event.target as HTMLInputElement;
    duration = parseInt(target.value) || 0;
    
    if (useDuration && startTime && duration > 0) {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(start.getTime() + duration * 60000);
      endTime = end.toTimeString().slice(0, 5);
    }
  }

  function handleUseDurationToggle(value: boolean) {
    useDuration = value;
    
    if (useDuration && startTime && duration > 0) {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(start.getTime() + duration * 60000);
      endTime = end.toTimeString().slice(0, 5);
    } else if (!useDuration && startTime && endTime) {
      duration = calculateDuration();
    }
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="modal-backdrop"
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
    role="presentation"
  >
    <!-- Modal Container -->
    <div 
      class="modal-container"
      in:scale={{ duration: 300, start: 0.95 }}
      out:scale={{ duration: 200, start: 0.95 }}
      tabindex="-1"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      on:keydown={handleKeydown}
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">
          <Icon name="plus" size={20} />
          Add Manual Time Entry
        </h2>
        
        <button 
          class="close-btn"
          on:click={closeModal}
          title="Close"
          aria-label="Close manual time entry"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      <!-- Modal Content -->
      <form class="modal-content" on:submit|preventDefault={handleSubmit}>
        {#if errors.general}
          <div class="error-message">
            <Icon name="alert-circle" size={16} />
            {errors.general}
          </div>
        {/if}

        <!-- Project Selection -->
        <div class="form-group">
          <label for="project-select" class="form-label">
            Project <span class="required">*</span>
          </label>
          <select 
            id="project-select"
            bind:value={selectedProjectId}
            class="form-select"
            class:error={errors.project}
            disabled={isSubmitting}
          >
            <option value={null}>Select a project</option>
            {#each projects as proj (proj.id)}
              <option value={proj.id}>{proj.name}</option>
            {/each}
          </select>
          {#if errors.project}
            <span class="error-text">{errors.project}</span>
          {/if}
        </div>

        <!-- Task Selection (Optional) -->
        {#if selectedProjectId && availableTasks.length > 0}
          <div class="form-group">
            <label for="task-select" class="form-label">Task (Optional)</label>
            <select 
              id="task-select"
              bind:value={selectedTaskId}
              class="form-select"
              disabled={isSubmitting}
            >
              <option value={null}>No specific task</option>
              {#each availableTasks as task (task.id)}
                <option value={task.id}>{task.title}</option>
              {/each}
            </select>
          </div>
        {/if}

        <!-- Description -->
        <div class="form-group">
          <label for="description" class="form-label">Description (Optional)</label>
          <textarea 
            id="description"
            bind:value={description}
            class="form-textarea"
            placeholder="What did you work on?"
            rows="2"
            disabled={isSubmitting}
          ></textarea>
        </div>

        <!-- Date -->
        <div class="form-group">
          <label for="date" class="form-label">
            Date <span class="required">*</span>
          </label>
          <input 
            id="date"
            type="date"
            bind:value={date}
            class="form-input"
            class:error={errors.date}
            disabled={isSubmitting}
          />
          {#if errors.date}
            <span class="error-text">{errors.date}</span>
          {/if}
        </div>

        <!-- Time Entry Method Toggle -->
        <div class="form-group">
          <label class="form-label">Time Entry Method</label>
          <div class="toggle-group">
            <button
              type="button"
              class="toggle-btn"
              class:active={!useDuration}
              on:click={() => handleUseDurationToggle(false)}
              disabled={isSubmitting}
            >
              <Icon name="clock" size={16} />
              Time Range
            </button>
            <button
              type="button"
              class="toggle-btn"
              class:active={useDuration}
              on:click={() => handleUseDurationToggle(true)}
              disabled={isSubmitting}
            >
              <Icon name="timer" size={16} />
              Duration
            </button>
          </div>
        </div>

        {#if useDuration}
          <!-- Duration Input -->
          <div class="form-row">
            <div class="form-group">
              <label for="start-time-duration" class="form-label">Start Time</label>
              <input 
                id="start-time-duration"
                type="time"
                value={startTime}
                on:input={handleStartTimeChange}
                class="form-input"
                disabled={isSubmitting}
              />
            </div>
            <div class="form-group">
              <label for="duration" class="form-label">
                Duration (minutes) <span class="required">*</span>
              </label>
              <input 
                id="duration"
                type="number"
                min="1"
                step="1"
                value={duration}
                on:input={handleDurationChange}
                class="form-input"
                class:error={errors.duration}
                placeholder="60"
                disabled={isSubmitting}
              />
              {#if errors.duration}
                <span class="error-text">{errors.duration}</span>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Time Range Inputs -->
          <div class="form-row">
            <div class="form-group">
              <label for="start-time" class="form-label">
                Start Time <span class="required">*</span>
              </label>
              <input 
                id="start-time"
                type="time"
                value={startTime}
                on:input={handleStartTimeChange}
                class="form-input"
                class:error={errors.startTime}
                disabled={isSubmitting}
              />
              {#if errors.startTime}
                <span class="error-text">{errors.startTime}</span>
              {/if}
            </div>
            <div class="form-group">
              <label for="end-time" class="form-label">
                End Time <span class="required">*</span>
              </label>
              <input 
                id="end-time"
                type="time"
                value={endTime}
                on:input={handleEndTimeChange}
                class="form-input"
                class:error={errors.endTime}
                disabled={isSubmitting}
              />
              {#if errors.endTime}
                <span class="error-text">{errors.endTime}</span>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Calculated Duration Display -->
        {#if calculateDuration() > 0}
          <div class="duration-display">
            <Icon name="clock" size={16} />
            <span>Duration: <strong>{Math.floor(calculateDuration() / 60)}h {calculateDuration() % 60}m</strong></span>
          </div>
        {/if}

        <!-- Intensity -->
        <div class="form-group">
          <label for="intensity" class="form-label">
            Effort Intensity <span class="required">*</span>
          </label>
          <div class="intensity-selector">
            {#each [1, 2, 3, 4, 5] as value}
              <button
                type="button"
                class="intensity-btn"
                class:active={intensity === value}
                on:click={() => intensity = value}
                title="Intensity {value}"
                disabled={isSubmitting}
              >
                {value}
              </button>
            {/each}
          </div>
          <div class="intensity-labels">
            <span>Low</span>
            <span>High</span>
          </div>
          {#if errors.intensity}
            <span class="error-text">{errors.intensity}</span>
          {/if}
        </div>

        <!-- Modal Actions -->
        <div class="modal-actions">
          <button 
            type="button"
            class="btn btn-secondary"
            on:click={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
            disabled={isSubmitting || !validateForm()}
          >
            {#if isSubmitting}
              <Icon name="loader" size={16} />
              Adding...
            {:else}
              <Icon name="plus" size={16} />
              Add Time Entry
            {/if}
          </button>
        </div>
      </form>
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
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-container {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 12px;
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(129, 161, 193, 0.1);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--nord3);
    background: var(--nord1);
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .close-btn {
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

  .close-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .modal-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(191, 97, 106, 0.1);
    border: 1px solid var(--nord11);
    border-radius: 6px;
    color: var(--nord11);
    font-size: 0.875rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nord6);
  }

  .required {
    color: var(--nord11);
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: 0.75rem;
    border: 1px solid var(--nord3);
    border-radius: 6px;
    background: var(--nord1);
    color: var(--nord6);
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--nord8);
    box-shadow: 0 0 0 2px rgba(129, 161, 193, 0.2);
  }

  .form-input.error,
  .form-select.error,
  .form-textarea.error {
    border-color: var(--nord11);
  }

  .form-textarea {
    resize: vertical;
    min-height: 3rem;
  }

  .error-text {
    font-size: 0.75rem;
    color: var(--nord11);
  }

  .toggle-group {
    display: flex;
    gap: 0.5rem;
  }

  .toggle-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--nord3);
    background: var(--nord1);
    color: var(--nord4);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .toggle-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .toggle-btn.active {
    background: var(--nord8);
    color: var(--nord0);
    border-color: var(--nord8);
  }

  .duration-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 6px;
    color: var(--nord6);
    font-size: 0.875rem;
  }

  .intensity-selector {
    display: flex;
    gap: 0.5rem;
  }

  .intensity-btn {
    width: 40px;
    height: 40px;
    border: 1px solid var(--nord3);
    background: var(--nord1);
    color: var(--nord4);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
  }

  .intensity-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .intensity-btn.active {
    background: var(--nord9);
    color: var(--nord0);
    border-color: var(--nord9);
  }

  .intensity-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--nord4);
    margin-top: 0.25rem;
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--nord3);
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--nord2);
    color: var(--nord6);
    border: 1px solid var(--nord3);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--nord3);
  }

  .btn-primary {
    background: var(--nord8);
    color: var(--nord0);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--nord9);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-container {
      max-height: 95vh;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-content {
      padding: 1rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .modal-actions {
      flex-direction: column-reverse;
    }

    .btn {
      justify-content: center;
    }
  }

  /* Accessibility */
  .modal-container:focus {
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .modal-container,
    .close-btn,
    .toggle-btn,
    .intensity-btn,
    .btn {
      transition: none;
    }
  }
</style>