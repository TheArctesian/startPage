# UI Components Documentation

This directory contains reusable UI components following UNIX philosophy: small, focused, composable building blocks.

## Files Overview

### `IntensityPicker.svelte` - Interactive Intensity Selection
Comprehensive input component for selecting task intensity levels (1-5 scale).

**Features:**
- Three visual variants: dots, buttons, slider
- Multiple sizes: sm, md, lg
- Keyboard navigation with arrow keys
- Accessibility with ARIA labels and roles
- Form integration with hidden input
- Optional labels and descriptions
- Disabled state support

**Props:**
```typescript
export let value: IntensityLevel = 1;              // Current intensity (1-5)
export let label: string = 'Intensity';           // Field label
export let description: string = '';              // Help text
export let size: 'sm' | 'md' | 'lg' = 'md';      // Component size
export let variant: 'dots' | 'buttons' | 'slider' = 'dots'; // Visual style
export let showLabels: boolean = false;           // Show "Very Easy" etc.
export let disabled: boolean = false;             // Disable interaction
export let required: boolean = false;             // Form validation
export let name: string = 'intensity';            // Form field name
```

**Usage:**
```svelte
<script>
  import IntensityPicker from '$lib/components/ui/IntensityPicker.svelte';
  
  let taskIntensity = 3;
</script>

<!-- Dots variant for compact display -->
<IntensityPicker 
  bind:value={taskIntensity}
  variant="dots" 
  size="md"
  label="Task Difficulty"
  showLabels={true}
/>

<!-- Button variant for forms -->
<IntensityPicker 
  bind:value={taskIntensity}
  variant="buttons" 
  size="lg"
  required={true}
/>

<!-- Slider variant for settings -->
<IntensityPicker 
  bind:value={taskIntensity}
  variant="slider"
  description="How mentally demanding will this task be?"
/>
```

### `IntensityDisplay.svelte` - Read-Only Intensity Visualization
Lightweight component for displaying intensity levels without interaction.

**Features:**
- Three visual variants: dots, text, badge
- Multiple sizes: xs, sm, md, lg
- Color-coded intensity levels
- Optional labels and values
- Hover effects
- Accessible tooltips

**Props:**
```typescript
export let intensity: IntensityLevel;             // Intensity to display (1-5)
export let size: 'xs' | 'sm' | 'md' | 'lg' = 'sm'; // Component size
export let variant: 'dots' | 'text' | 'badge' = 'dots'; // Visual style
export let showLabel: boolean = false;            // Show "Very Easy" etc.
export let showValue: boolean = false;            // Show "3/5" etc.
```

**Usage:**
```svelte
<script>
  import IntensityDisplay from '$lib/components/ui/IntensityDisplay.svelte';
</script>

<!-- Compact dots for task cards -->
<IntensityDisplay 
  intensity={task.estimatedIntensity} 
  variant="dots" 
  size="sm" 
/>

<!-- Badge for headers -->
<IntensityDisplay 
  intensity={task.actualIntensity} 
  variant="badge" 
  size="md"
  showLabel={true}
/>

<!-- Text with value for detailed views -->
<IntensityDisplay 
  intensity={task.estimatedIntensity} 
  variant="text" 
  showLabel={true}
  showValue={true}
/>
```

## Design Principles

### UNIX Philosophy Implementation

1. **Single Responsibility:**
   - `IntensityPicker` - Interactive input only
   - `IntensityDisplay` - Read-only display only

2. **Composability:**
   - Can be used in forms, task cards, headers, summaries
   - Multiple size variants for different contexts
   - Consistent API across variants

3. **Reusability:**
   - No hardcoded styling dependencies
   - Flexible props for customization
   - Works with any form library

### Accessibility Features

- **Keyboard Navigation:** Arrow keys for intensity selection
- **Screen Readers:** ARIA labels, roles, and descriptions
- **Focus Management:** Visible focus indicators
- **Semantic HTML:** Proper form controls and labels
- **Color Independence:** Text labels available for colorblind users

### Visual Design System

#### Intensity Color Mapping
```css
1 (Very Easy):  var(--nord14) /* Green */
2 (Easy):       var(--nord13) /* Light Green */  
3 (Medium):     var(--nord8)  /* Blue */
4 (Hard):       var(--nord12) /* Orange */
5 (Very Hard):  var(--nord11) /* Red */
```

#### Size System
- `xs` - 8px dots, 10px text - For dense lists
- `sm` - 12px dots, 14px text - For task cards  
- `md` - 16px dots, 16px text - For forms
- `lg` - 20px dots, 18px text - For headers

#### Variant Guidelines
- **Dots** - Best for compact spaces, quick visual scanning
- **Buttons** - Best for forms, clear selection states
- **Slider** - Best for settings, continuous feel
- **Text** - Best for detailed views, maximum clarity
- **Badge** - Best for status indicators, prominent display

## Component Integration

### Task Creation Form
```svelte
<form class="task-form">
  <input type="text" placeholder="Task title" bind:value={title} />
  
  <div class="form-row">
    <div class="form-field">
      <label>Estimated Time</label>
      <input type="number" bind:value={estimatedMinutes} />
    </div>
    
    <div class="form-field">
      <IntensityPicker 
        bind:value={estimatedIntensity}
        variant="buttons"
        label="Difficulty Level"
        description="How mentally demanding will this be?"
        required={true}
      />
    </div>
  </div>
</form>
```

### Task Card Display
```svelte
<div class="task-card">
  <h3 class="task-title">{task.title}</h3>
  
  <div class="task-metadata">
    <span class="time-estimate">{task.estimatedMinutes}m</span>
    <IntensityDisplay 
      intensity={task.estimatedIntensity} 
      variant="dots" 
      size="sm"
    />
  </div>
  
  {#if task.actualIntensity}
    <div class="task-actual">
      <span>Actual:</span>
      <IntensityDisplay 
        intensity={task.actualIntensity} 
        variant="badge" 
        size="xs"
        showValue={true}
      />
    </div>
  {/if}
</div>
```

### Task Completion Modal
```svelte
<div class="completion-modal">
  <h2>How was the task difficulty?</h2>
  <p>You estimated: 
    <IntensityDisplay 
      intensity={task.estimatedIntensity} 
      variant="text"
      showLabel={true}
    />
  </p>
  
  <IntensityPicker 
    bind:value={actualIntensity}
    variant="buttons"
    size="lg"
    label="Actual Difficulty"
    showLabels={true}
    required={true}
  />
  
  <button onclick={completeTask}>Complete Task</button>
</div>
```

## Performance Considerations

### Optimization Strategies
1. **Lightweight Components** - Minimal DOM elements
2. **CSS-Only Animations** - No JavaScript animations
3. **Event Delegation** - Efficient event handling
4. **Reactive Updates** - Only re-render when value changes

### Bundle Size
- Small components with minimal dependencies
- Shared styling through CSS variables
- Tree-shakeable exports

## Testing Strategies

### Unit Tests
- Intensity selection and binding
- Keyboard navigation
- Accessibility attributes
- Variant rendering

### Integration Tests
- Form integration
- Event handling
- State management
- Error states

### Accessibility Tests
- Screen reader compatibility
- Keyboard-only navigation
- Color contrast ratios
- Focus management

## Future Enhancements

### Potential Features
- **Custom Intensity Scales** - Beyond 1-5 range
- **Animation Presets** - Smooth transitions between states
- **Touch Gestures** - Swipe to change intensity on mobile
- **Voice Input** - "Set intensity to medium"
- **Smart Defaults** - ML-based intensity suggestions

### API Extensions
```typescript
// Potential future props
export let scale: number = 5;                     // Custom scale (3, 7, 10)
export let customLabels: string[] = [];          // Override default labels
export let colorScheme: 'default' | 'custom' = 'default'; // Custom colors
export let animate: boolean = false;             // Smooth transitions
export let tooltips: boolean = true;             // Show/hide tooltips
```