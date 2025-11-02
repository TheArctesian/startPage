<script lang="ts">
  import type { IntensityLevel } from '$lib/types/database';

  let {
    value = $bindable(1),
    label = 'Intensity',
    description = '',
    size = 'md',
    variant = 'dots',
    showLabels = false,
    disabled = false,
    required = false,
    name = 'intensity'
  } = $props<{
    value?: IntensityLevel;
    label?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'dots' | 'buttons' | 'slider';
    showLabels?: boolean;
    disabled?: boolean;
    required?: boolean;
    name?: string;
  }>();

  // Intensity level descriptions
  const intensityLabels = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Very Hard'
  } as const;

  // Handle selection
  function selectIntensity(level: IntensityLevel) {
    if (disabled) return;
    value = level;
  }

  // Handle keyboard navigation for buttons/slider
  function handleKeydown(event: KeyboardEvent, level: IntensityLevel) {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectIntensity(level);
    } else if (event.key === 'ArrowLeft' && level > 1) {
      event.preventDefault();
      selectIntensity((level - 1) as IntensityLevel);
    } else if (event.key === 'ArrowRight' && level < 5) {
      event.preventDefault();
      selectIntensity((level + 1) as IntensityLevel);
    }
  }

  // Size classes
  const sizeClasses = {
    sm: {
      dot: 'w-3 h-3',
      button: 'w-6 h-6 text-xs',
      container: 'gap-1'
    },
    md: {
      dot: 'w-4 h-4',
      button: 'w-8 h-8 text-sm',
      container: 'gap-2'
    },
    lg: {
      dot: 'w-5 h-5',
      button: 'w-10 h-10 text-base',
      container: 'gap-3'
    }
  };

  let currentSize = $derived(sizeClasses[size]);
</script>

<div class="intensity-picker" class:disabled>
  <!-- Label -->
  {#if label}
    <label class="label" for={name}>
      {label}
      {#if required}
        <span class="required" aria-label="required">*</span>
      {/if}
    </label>
  {/if}

  <!-- Description -->
  {#if description}
    <p class="description">{description}</p>
  {/if}

  <!-- Current Value Display -->
  {#if showLabels}
    <div class="current-value">
      <span class="value-text">
        {intensityLabels[value]} ({value}/5)
      </span>
    </div>
  {/if}

  <!-- Dots Variant -->
  {#if variant === 'dots'}
    <div class="picker-container dots {currentSize.container}" role="radiogroup" aria-labelledby={label ? `${name}-label` : undefined}>
      {#each [1, 2, 3, 4, 5] as level}
        <button
          type="button"
          class="dot {currentSize.dot}"
          class:filled={level <= value}
          class:selected={level === value}
          onclick={() => selectIntensity(level)}
          onkeydown={(e) => handleKeydown(e, level)}
          {disabled}
          title="{intensityLabels[level]} ({level}/5)"
          aria-label="{intensityLabels[level]} ({level}/5)"
          role="radio"
          aria-checked={level === value}
        >
          <span class="sr-only">{intensityLabels[level]}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Buttons Variant -->
  {#if variant === 'buttons'}
    <div class="picker-container buttons {currentSize.container}" role="radiogroup" aria-labelledby={label ? `${name}-label` : undefined}>
      {#each [1, 2, 3, 4, 5] as level}
        <button
          type="button"
          class="number-btn {currentSize.button}"
          class:selected={level === value}
          onclick={() => selectIntensity(level)}
          onkeydown={(e) => handleKeydown(e, level)}
          {disabled}
          title="{intensityLabels[level]} ({level}/5)"
          aria-label="{intensityLabels[level]} ({level}/5)"
          role="radio"
          aria-checked={level === value}
        >
          {level}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Slider Variant -->
  {#if variant === 'slider'}
    <div class="picker-container slider">
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        bind:value
        {disabled}
        {name}
        class="intensity-slider"
        title="{intensityLabels[value]} ({value}/5)"
        aria-label="{intensityLabels[value]} ({value}/5)"
      />
      <div class="slider-labels">
        {#each [1, 2, 3, 4, 5] as level}
          <span 
            class="slider-label"
            class:active={level === value}
          >
            {level}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Hidden input for form submission -->
  <input type="hidden" {name} {value} {required} />
</div>

<style>
  .intensity-picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .intensity-picker.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--nord6);
    margin-bottom: 0.25rem;
  }

  .required {
    color: var(--nord11);
    margin-left: 0.25rem;
  }

  .description {
    font-size: 0.75rem;
    color: var(--nord4);
    margin: 0;
  }

  .current-value {
    font-size: 0.875rem;
    color: var(--nord8);
    font-weight: 500;
  }

  .picker-container {
    display: flex;
    align-items: center;
  }

  /* Dots Variant */
  .dots {
    justify-content: flex-start;
  }

  .dot {
    border-radius: 50%;
    background: var(--nord3);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .dot:hover:not(:disabled) {
    transform: scale(1.1);
  }

  .dot.filled {
    background: var(--nord8);
  }

  .dot.selected {
    background: var(--nord9);
    box-shadow: 0 0 0 2px var(--nord9);
  }

  /* Buttons Variant */
  .buttons {
    justify-content: flex-start;
  }

  .number-btn {
    border-radius: 0.375rem;
    background: var(--nord2);
    border: 1px solid var(--nord3);
    color: var(--nord6);
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .number-btn:hover:not(:disabled) {
    background: var(--nord3);
    border-color: var(--nord4);
    transform: translateY(-1px);
  }

  .number-btn.selected {
    background: var(--nord8);
    border-color: var(--nord8);
    color: var(--nord0);
  }

  /* Slider Variant */
  .slider {
    flex-direction: column;
    gap: 0.5rem;
  }

  .intensity-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--nord3);
    outline: none;
    appearance: none;
    cursor: pointer;
  }

  .intensity-slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--nord8);
    cursor: pointer;
    border: 2px solid var(--nord0);
    transition: all 0.2s ease;
  }

  .intensity-slider::-webkit-slider-thumb:hover {
    background: var(--nord9);
    transform: scale(1.1);
  }

  .intensity-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--nord8);
    cursor: pointer;
    border: 2px solid var(--nord0);
    transition: all 0.2s ease;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    padding: 0 10px;
  }

  .slider-label {
    font-size: 0.75rem;
    color: var(--nord4);
    transition: color 0.2s ease;
  }

  .slider-label.active {
    color: var(--nord8);
    font-weight: 600;
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

  /* Focus styles for accessibility */
  .dot:focus,
  .number-btn:focus,
  .intensity-slider:focus {
    outline: 2px solid var(--nord8);
    outline-offset: 2px;
  }

  /* Disabled state */
  .dot:disabled,
  .number-btn:disabled,
  .intensity-slider:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .dot:disabled:hover,
  .number-btn:disabled:hover {
    transform: none;
  }
</style>