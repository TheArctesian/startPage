<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IntensityPicker from '$lib/components/ui/IntensityPicker.svelte';
  import { activeProject, projects, createTask, updateTask } from '$lib/stores';
  import type { TaskFormData, Task, Project, IntensityLevel, Priority } from '$lib/types/database';

  // Props
  export let task: Task | null = null; // null for new task, Task for editing
  export let isOpen: boolean = false;
  export let autoFocus: boolean = true;

  const dispatch = createEventDispatcher<{
    submit: { task: Task };
    cancel: void;
    close: void;
  }>();

  // Form state
  let formData: TaskFormData = {
    title: '',
    description: '',
    linkUrl: '',
    projectId: 0,
    estimatedMinutes: 30,
    estimatedIntensity: 3 as IntensityLevel,
    priority: 'medium' as Priority,
    dueDate: undefined,
    tags: []
  };

  let errors: Partial<Record<keyof TaskFormData, string>> = {};
  let isSubmitting = false;

  // Reactive values
  $: currentProject = $activeProject;
  $: availableProjects = $projects;
  $: isEditing = task !== null;
  $: submitLabel = isEditing ? 'Update Task' : 'Create Task';

  // Time estimation presets
  const timePresets = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '4 hours', value: 240 },
    { label: '1 day', value: 480 }
  ];

  // Initialize form when task or project changes
  function initializeForm() {
    if (task) {
      // Editing existing task
      formData = {
        title: task.title,
        description: task.description || '',
        linkUrl: task.linkUrl || '',
        projectId: task.projectId || 0,
        estimatedMinutes: task.estimatedMinutes,
        estimatedIntensity: task.estimatedIntensity,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined
      };
    } else {
      // New task
      formData = {
        title: '',
        description: '',
        linkUrl: '',
        projectId: currentProject?.id || 0,
        estimatedMinutes: 30,
        estimatedIntensity: 3 as IntensityLevel,
        priority: 'medium' as Priority,
        dueDate: undefined
      };
    }
    errors = {};
  }

  // Watch for changes to task or current project
  $: if (isOpen) {
    initializeForm();
  }

  // Form validation
  function validateForm(): boolean {
    errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
    } else if (formData.title.length > 500) {
      errors.title = 'Title must be less than 500 characters';
    }

    if (formData.linkUrl && formData.linkUrl.trim()) {
      try {
        new URL(formData.linkUrl);
      } catch {
        errors.linkUrl = 'Please enter a valid URL';
      }
    }

    if (!formData.projectId) {
      errors.projectId = 'Please select a project';
    }

    if (formData.estimatedMinutes < 1 || formData.estimatedMinutes > 1440) {
      errors.estimatedMinutes = 'Time must be between 1 and 1440 minutes';
    }

    if (formData.estimatedIntensity < 1 || formData.estimatedIntensity > 5) {
      errors.estimatedIntensity = 'Intensity must be between 1 and 5';
    }

    return Object.keys(errors).length === 0;
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm() || isSubmitting) return;

    isSubmitting = true;
    try {
      const taskData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        linkUrl: formData.linkUrl?.trim() || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
      };

      let resultTask: Task;
      
      if (isEditing && task) {
        resultTask = await updateTask(task.id, taskData);
      } else {
        resultTask = await createTask(taskData);
      }

      dispatch('submit', { task: resultTask });
      handleCancel();
    } catch (error) {
      console.error('Failed to save task:', error);
      errors.title = error instanceof Error ? error.message : 'Failed to save task';
    } finally {
      isSubmitting = false;
    }
  }

  // Handle cancel
  function handleCancel() {
    initializeForm();
    dispatch('cancel');
    isOpen = false;
  }

  // Handle close (ESC key)
  function handleClose() {
    dispatch('close');
    isOpen = false;
  }

  // Handle keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }

  // Set time preset
  function setTimePreset(minutes: number) {
    formData.estimatedMinutes = minutes;
  }

  // Focus first input when form opens
  let titleInput: HTMLInputElement;
  $: if (isOpen && autoFocus && titleInput) {
    setTimeout(() => titleInput?.focus(), 100);
  }
</script>

<!-- Modal backdrop -->
{#if isOpen}
  <div 
    class="modal-backdrop"
    onclick={(e) => e.target === e.currentTarget && handleCancel()}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="task-form-title"
  >
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <h2 id="task-form-title" class="modal-title">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h2>
        <button 
          class="close-btn"
          onclick={handleClose}
          title="Close (Esc)"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <form class="task-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <!-- Title -->
        <div class="form-group">
          <label for="title" class="form-label">
            Task Title *
          </label>
          <input
            bind:this={titleInput}
            bind:value={formData.title}
            type="text"
            id="title"
            name="title"
            class="form-input"
            class:error={errors.title}
            placeholder="What needs to be done?"
            maxlength="500"
            required
          />
          {#if errors.title}
            <span class="error-message">{errors.title}</span>
          {/if}
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description" class="form-label">
            Description
          </label>
          <textarea
            bind:value={formData.description}
            id="description"
            name="description"
            class="form-textarea"
            placeholder="Add details about this task..."
            rows="3"
          ></textarea>
        </div>

        <!-- Link URL -->
        <div class="form-group">
          <label for="link-url" class="form-label">
            Related Link
          </label>
          <input
            bind:value={formData.linkUrl}
            type="url"
            id="link-url"
            name="linkUrl"
            class="form-input"
            class:error={errors.linkUrl}
            placeholder="https://example.com/reference"
          />
          {#if errors.linkUrl}
            <span class="error-message">{errors.linkUrl}</span>
          {/if}
        </div>

        <!-- Project Selection -->
        <div class="form-group">
          <label for="project" class="form-label">
            Project *
          </label>
          <select
            bind:value={formData.projectId}
            id="project"
            name="project"
            class="form-select"
            class:error={errors.projectId}
            required
          >
            <option value={0}>Select a project</option>
            {#each availableProjects as project}
              <option value={project.id}>
                {project.icon ? `${project.icon} ` : ''}{project.name}
              </option>
            {/each}
          </select>
          {#if errors.projectId}
            <span class="error-message">{errors.projectId}</span>
          {/if}
        </div>

        <!-- Time and Intensity Row -->
        <div class="form-row">
          <!-- Estimated Time -->
          <div class="form-group">
            <label for="estimated-time" class="form-label">
              Estimated Time *
            </label>
            <div class="time-input-group">
              <input
                bind:value={formData.estimatedMinutes}
                type="number"
                id="estimated-time"
                name="estimatedMinutes"
                class="form-input time-input"
                class:error={errors.estimatedMinutes}
                min="1"
                max="1440"
                required
              />
              <span class="time-unit">minutes</span>
            </div>
            
            <!-- Time Presets -->
            <div class="time-presets">
              {#each timePresets as preset}
                <button
                  type="button"
                  class="preset-btn"
                  class:active={formData.estimatedMinutes === preset.value}
                  onclick={() => setTimePreset(preset.value)}
                >
                  {preset.label}
                </button>
              {/each}
            </div>
            
            {#if errors.estimatedMinutes}
              <span class="error-message">{errors.estimatedMinutes}</span>
            {/if}
          </div>

          <!-- Intensity -->
          <div class="form-group">
            <IntensityPicker
              bind:value={formData.estimatedIntensity}
              label="Difficulty Level *"
              description="How mentally demanding will this task be?"
              variant="buttons"
              size="md"
              showLabels={true}
              required={true}
              name="estimatedIntensity"
            />
            {#if errors.estimatedIntensity}
              <span class="error-message">{errors.estimatedIntensity}</span>
            {/if}
          </div>
        </div>

        <!-- Priority and Due Date Row -->
        <div class="form-row">
          <!-- Priority -->
          <div class="form-group">
            <label for="priority" class="form-label">
              Priority
            </label>
            <select
              bind:value={formData.priority}
              id="priority"
              name="priority"
              class="form-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <!-- Due Date -->
          <div class="form-group">
            <label for="due-date" class="form-label">
              Due Date
            </label>
            <input
              bind:value={formData.dueDate}
              type="date"
              id="due-date"
              name="dueDate"
              class="form-input"
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            onclick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            class="btn btn-primary"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <span class="loading-spinner"></span>
              Saving...
            {:else}
              {submitLabel}
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--nord0);
    border: 1px solid var(--nord3);
    border-radius: 0.75rem;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 0;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0;
  }

  .close-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: var(--nord4);
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--nord2);
    color: var(--nord6);
  }

  .task-form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  .form-input,
  .form-textarea,
  .form-select {
    padding: 0.75rem;
    border: 1px solid var(--nord3);
    border-radius: 0.375rem;
    background: var(--nord1);
    color: var(--nord6);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--nord8);
    box-shadow: 0 0 0 3px rgba(129, 161, 193, 0.1);
  }

  .form-input.error,
  .form-textarea.error,
  .form-select.error {
    border-color: var(--nord11);
  }

  .form-textarea {
    resize: vertical;
    min-height: 4rem;
  }

  .time-input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .time-input {
    flex: 1;
    min-width: 0;
  }

  .time-unit {
    font-size: 0.875rem;
    color: var(--nord4);
    font-weight: 500;
  }

  .time-presets {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .preset-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--nord3);
    border-radius: 0.25rem;
    background: var(--nord1);
    color: var(--nord4);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preset-btn:hover {
    background: var(--nord2);
    border-color: var(--nord4);
  }

  .preset-btn.active {
    background: var(--nord8);
    border-color: var(--nord8);
    color: var(--nord0);
  }

  .error-message {
    font-size: 0.75rem;
    color: var(--nord11);
    margin-top: 0.25rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--nord3);
    color: var(--nord6);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--nord4);
  }

  .btn-primary {
    background: var(--nord8);
    color: var(--nord0);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--nord9);
    transform: translateY(-1px);
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
    .modal-content {
      margin: 0;
      border-radius: 0;
      max-height: 100vh;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .time-presets {
      grid-template-columns: repeat(3, 1fr);
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .form-input,
    .form-textarea,
    .form-select {
      border-width: 2px;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      border-width: 3px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .btn,
    .preset-btn,
    .close-btn {
      transition: none;
    }

    .loading-spinner {
      animation: none;
    }
  }
</style>