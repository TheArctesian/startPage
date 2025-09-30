# Timer Components Documentation

This directory contains timer-related UI components following UNIX philosophy: focused, composable, and reusable components.

## Files Overview

### `Timer.svelte` - Main Timer Display
Comprehensive timer component for the header/main area with full functionality.

**Features:**
- Real-time elapsed time display with monospace font
- Current task information with title and metadata
- Estimated time and intensity visualization
- Start/stop controls with loading states
- Auto-updates every second when active
- Restores active timer on component mount
- Keyboard accessible with ARIA labels

**Props:**
- None (uses global timer state from stores)

**Exports:**
- `toggleTimer(task?: Task)` - Function to start/stop timer programmatically

**Usage:**
```svelte
<script>
  import Timer from '$lib/components/timer/Timer.svelte';
  
  let timerRef;
  
  // Toggle timer with current task
  function handleSpaceKey() {
    timerRef?.toggleTimer();
  }
</script>

<Timer bind:this={timerRef} />
```

### `TimerControls.svelte` - Compact Timer Buttons
Reusable start/stop button component for task cards and inline usage.

**Features:**
- Compact button design with icons
- Multiple size variants (sm, md, lg)
- Multiple visual variants (primary, secondary, minimal)
- Loading states during API calls
- Can use provided task or global selected task
- Accessible with proper ARIA attributes

**Props:**
```typescript
export let task: Task | null = null;           // Specific task (optional)
export let size: 'sm' | 'md' | 'lg' = 'md';   // Button size
export let variant: 'primary' | 'secondary' | 'minimal' = 'primary'; // Visual style
```

**Exports:**
- `toggle()` - Function to toggle timer state

**Usage:**
```svelte
<script>
  import TimerControls from '$lib/components/timer/TimerControls.svelte';
</script>

<!-- For specific task -->
<TimerControls {task} size="sm" variant="minimal" />

<!-- Uses global selected task -->
<TimerControls size="lg" variant="primary" />
```

## Design Principles

### UNIX Philosophy Implementation

1. **Single Responsibility:**
   - `Timer.svelte` - Full-featured timer display
   - `TimerControls.svelte` - Just start/stop buttons

2. **Composability:**
   - TimerControls can be used in task cards, lists, forms
   - Timer component for main header/dashboard area
   - Both components work with same store state

3. **Reusability:**
   - TimerControls accepts different tasks
   - Multiple size and style variants
   - No hardcoded styling dependencies

### State Management Integration

- Components use centralized timer stores
- No local timer state management
- Automatic persistence across page refreshes
- Real-time synchronization between components

### Accessibility Features

- ARIA labels for screen readers
- Keyboard navigation support
- Loading state indicators
- Semantic button elements
- High contrast visual states

## Styling System

### CSS Variables (Nord Theme)
```css
--nord0   /* Background dark */
--nord1   /* Background medium */
--nord3   /* Border/inactive */
--nord4   /* Text muted */
--nord6   /* Text primary */
--nord8   /* Accent blue */
--nord11  /* Error red */
--nord14  /* Success green */
```

### Responsive Design
- Mobile-first approach
- Stacked layout on small screens
- Touch-friendly button sizes
- Readable font scaling

### Animation Guidelines
- Subtle hover effects (translateY)
- Smooth transitions (0.2s ease)
- Pulsing effect for active timer
- Loading spinner animations

## Component States

### Timer Display States
1. **Idle** - No timer running, no task selected
2. **Ready** - Task selected, timer not running
3. **Active** - Timer running with real-time updates
4. **Loading** - Starting/stopping timer (API call)

### Button States
1. **Start** - Play icon, enabled when task available
2. **Stop** - Pause icon, enabled when timer active
3. **Loading** - Spinner, disabled during API calls
4. **Disabled** - Muted, no task available or loading

## Integration Examples

### Header Timer
```svelte
<!-- Main header with always-visible timer -->
<header class="app-header">
  <div class="timer-section">
    <Timer />
  </div>
</header>
```

### Task Card Timer
```svelte
<!-- Compact timer control in task card -->
<div class="task-card">
  <h3>{task.title}</h3>
  <div class="task-actions">
    <TimerControls {task} size="sm" variant="minimal" />
  </div>
</div>
```

### Kanban Board Integration
```svelte
<!-- Timer controls for each task in board -->
{#each tasks as task}
  <div class="kanban-card">
    <span class="task-title">{task.title}</span>
    <div class="card-footer">
      <span class="time-estimate">{task.estimatedMinutes}m</span>
      <TimerControls {task} size="sm" variant="secondary" />
    </div>
  </div>
{/each}
```

### Keyboard Shortcuts Integration
```svelte
<script>
  import Timer from '$lib/components/timer/Timer.svelte';
  
  let timerComponent;
  
  function handleKeydown(event) {
    if (event.code === 'Space' && !event.target.matches('input, textarea')) {
      event.preventDefault();
      timerComponent?.toggleTimer();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />
<Timer bind:this={timerComponent} />
```

## Performance Considerations

### Optimization Strategies
1. **Efficient Updates** - 1-second intervals only when timer active
2. **Event Cleanup** - Intervals cleared on component destroy
3. **Debounced Actions** - Prevent rapid start/stop clicks
4. **Minimal Re-renders** - Derived stores for computed values

### Memory Management
- Timer intervals automatically cleaned up
- Store subscriptions handled by Svelte
- No memory leaks from event listeners
- Efficient DOM updates with reactive statements

## Testing Considerations

### Unit Tests
- Timer display formatting (MM:SS, H:MM:SS)
- Start/stop functionality
- Loading state handling
- Error state management

### Integration Tests
- Timer persistence across page refreshes
- Multiple timer controls synchronization
- Keyboard shortcut integration
- Store state consistency

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios
- Focus management