<script lang="ts">
  import type { IntensityLevel } from '$lib/types/database';

  let {
    intensity,
    size = 'sm',
    variant = 'dots',
    showLabel = false,
    showValue = false
  } = $props<{
    intensity: IntensityLevel;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'dots' | 'text' | 'badge';
    showLabel?: boolean;
    showValue?: boolean;
  }>();

  // Intensity level descriptions
  const intensityLabels = {
    1: 'Very Easy',
    2: 'Easy', 
    3: 'Medium',
    4: 'Hard',
    5: 'Very Hard'
  } as const;

  // Color mapping for intensity levels
  const intensityColors = {
    1: 'var(--nord14)', // Green - easy
    2: 'var(--nord13)', // Light green
    3: 'var(--nord8)',  // Blue - medium
    4: 'var(--nord12)', // Orange
    5: 'var(--nord11)'  // Red - hard
  } as const;

  // Size classes
  const sizeClasses = {
    xs: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      badge: 'text-xs px-1 py-0.5',
      container: 'gap-0.5'
    },
    sm: {
      dot: 'w-3 h-3',
      text: 'text-sm', 
      badge: 'text-sm px-2 py-1',
      container: 'gap-1'
    },
    md: {
      dot: 'w-4 h-4',
      text: 'text-base',
      badge: 'text-base px-2 py-1',
      container: 'gap-1.5'
    },
    lg: {
      dot: 'w-5 h-5',
      text: 'text-lg',
      badge: 'text-lg px-3 py-1.5',
      container: 'gap-2'
    }
  };

  let currentSize = $derived(sizeClasses[size as keyof typeof sizeClasses]);
  let currentColor = $derived(intensityColors[intensity as keyof typeof intensityColors]);
  let currentLabel = $derived(intensityLabels[intensity as keyof typeof intensityLabels]);
</script>

<div class="intensity-display" class:with-label={showLabel}>
  <!-- Dots Variant -->
  {#if variant === 'dots'}
    <div class="dots-container {currentSize.container}">
      {#each [1, 2, 3, 4, 5] as level}
        <div
          class="dot {currentSize.dot}"
          class:filled={level <= intensity}
          style="--dot-color: {intensityColors[level as IntensityLevel]}"
          title="{currentLabel} ({intensity}/5)"
        ></div>
      {/each}
      
      {#if showLabel || showValue}
        <span class="dots-label {currentSize.text}">
          {#if showLabel}{currentLabel}{/if}
          {#if showLabel && showValue} · {/if}
          {#if showValue}{intensity}/5{/if}
        </span>
      {/if}
    </div>
  {/if}

  <!-- Text Variant -->
  {#if variant === 'text'}
    <span 
      class="text-display {currentSize.text}"
      style="color: {currentColor}"
      title="{currentLabel} ({intensity}/5)"
    >
      {#if showLabel}
        {currentLabel}
        {#if showValue} ({intensity}/5){/if}
      {:else if showValue}
        {intensity}/5
      {:else}
        {currentLabel}
      {/if}
    </span>
  {/if}

  <!-- Badge Variant -->
  {#if variant === 'badge'}
    <span 
      class="badge-display {currentSize.badge}"
      style="background-color: {currentColor}; color: var(--nord0)"
      title="{currentLabel} ({intensity}/5)"
    >
      {#if showLabel}
        {currentLabel}
        {#if showValue} ({intensity}/5){/if}
      {:else if showValue}
        {intensity}/5
      {:else}
        {intensity}
      {/if}
    </span>
  {/if}
</div>

<style>
  .intensity-display {
    display: inline-flex;
    align-items: center;
  }

  /* Dots Variant */
  .dots-container {
    display: flex;
    align-items: center;
  }

  .dot {
    border-radius: 50%;
    background: var(--nord3);
    transition: all 0.2s ease;
  }

  .dot.filled {
    background: var(--dot-color);
  }

  .dots-label {
    color: var(--nord4);
    font-weight: 500;
    margin-left: 0.375rem;
  }

  /* Text Variant */
  .text-display {
    font-weight: 500;
    transition: color 0.2s ease;
  }

  /* Badge Variant */
  .badge-display {
    border-radius: 0.375rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  /* Hover effects */
  .intensity-display:hover .dot.filled {
    transform: scale(1.1);
  }

  .intensity-display:hover .badge-display {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .dots-label {
      display: none;
    }
    
    .text-display {
      font-size: 0.875rem;
    }
    
    .badge-display {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }
  }
</style>