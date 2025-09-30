# Keyboard Components Documentation

This directory contains keyboard interaction components following UNIX philosophy: focused, composable, and predictable keyboard shortcuts system.

## Architecture Overview

The keyboard system provides global keyboard shortcuts with contextual awareness:

```
src/lib/components/keyboard/
├── ShortcutsHelp.svelte    # Help modal displaying all shortcuts
└── README.md               # This documentation
```

## Design Philosophy

### UNIX Principles Applied

1. **Single Responsibility**: Each component handles one aspect of keyboard interaction
2. **Composable Interface**: Shortcuts can be registered/unregistered dynamically
3. **Predictable Behavior**: Consistent key combinations across contexts
4. **Context Awareness**: Shortcuts adapt based on current application state

### Keyboard Interaction Patterns

```typescript
// Global shortcuts (always active)
Space -> Start/pause timer
Cmd+N -> New task
? -> Show help

// Context-specific shortcuts (active in certain areas)
Enter -> Edit selected task (in kanban)
Delete -> Delete selected task (in kanban)
Escape -> Close modal (in modal context)
```

## Component Structure

### `ShortcutsHelp.svelte`

**Purpose**: Display comprehensive keyboard shortcuts help in a modal interface.

**Features**:
- Organized by category (Global, Timer, Tasks, Navigation)
- Platform-specific modifier key display (Cmd on Mac, Ctrl on Windows/Linux)
- Responsive design with mobile adaptations
- Accessibility compliant with focus management
- Tips section for user education

**Props**:
```typescript
export let isOpen: boolean = false;
```

**Events**:
```typescript
// Dispatched when user closes the modal
on:close: void
```

**Usage**:
```svelte
<ShortcutsHelp 
  bind:isOpen={showHelp}
  on:close={() => showHelp = false}
/>
```

### Integration with Layout

The help component integrates with the main layout:

```svelte
<!-- Header button to trigger help -->
<button 
  class="help-toggle"
  onclick={handleShowHelp}
  title="Keyboard shortcuts (Press ?)"
>
  <span class="help-icon">⌨️</span>
</button>

<!-- Help modal -->
<ShortcutsHelp 
  bind:isOpen={showShortcutsHelp}
  on:close={() => showShortcutsHelp = false}
/>
```

## Keyboard Store Integration

### Store Architecture

The keyboard system uses a centralized store (`$lib/stores/keyboard.ts`):

```typescript
// Store structure
interface KeyboardState {
  shortcuts: KeyboardShortcut[];
  isEnabled: boolean;
  activeContext: string | null;
}

// Shortcut definition
interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: {
    ctrl?: boolean;
    cmd?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
  description: string;
  action: () => void;
  enabled?: boolean;
  context?: string;
}
```

### Shortcut Registration

```typescript
// Register a new shortcut
registerShortcut({
  id: 'new-task',
  key: 'n',
  modifiers: { cmd: true },
  description: 'Create new task',
  action: () => handleNewTask()
});

// Context-specific shortcut
registerShortcut({
  id: 'save-form',
  key: 's',
  modifiers: { cmd: true },
  description: 'Save current form',
  context: 'modal',
  action: () => handleSave()
});
```

### Context Management

```typescript
// Set context for conditional shortcuts
setKeyboardContext('modal');    // Enable modal shortcuts
setKeyboardContext('kanban');   // Enable kanban shortcuts
setKeyboardContext(null);       // Global shortcuts only
```

## Default Shortcuts System

### Global Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `Space` | Timer toggle | Start/pause the active timer |
| `Cmd+N` | New task | Create new task (when project selected) |
| `Cmd+K` | Search tasks | Open task search (future feature) |
| `Cmd+B` | Toggle sidebar | Show/hide project sidebar |
| `Cmd+L` | Toggle links | Show/hide quick links sidebar |
| `?` | Show help | Display keyboard shortcuts help |
| `Escape` | Cancel/close | Close modals, clear selections |

### Context-Specific Shortcuts

**Kanban Context** (when viewing tasks):
| Key | Action | Description |
|-----|--------|-------------|
| `Enter` | Edit task | Edit the selected task |
| `Delete` | Delete task | Delete the selected task |
| `C` | Complete task | Mark task as complete |

**Modal Context** (when in forms):
| Key | Action | Description |
|-----|--------|-------------|
| `Cmd+S` | Save | Save the current form |
| `Escape` | Cancel | Close modal without saving |

### Event-Driven Architecture

Shortcuts dispatch custom events for loose coupling:

```typescript
// Shortcut action dispatches event
action: () => {
  const event = new CustomEvent('shortcut:new-task');
  document.dispatchEvent(event);
}

// Component listens for event
document.addEventListener('shortcut:new-task', handleNewTask);
```

## Platform Compatibility

### Cross-Platform Modifier Keys

```typescript
// Automatic platform detection
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

// Display appropriate modifier
const modifierDisplay = isMac ? 'Cmd' : 'Ctrl';
const actualModifier = isMac ? 'metaKey' : 'ctrlKey';
```

### Key Combination Matching

```typescript
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check main key
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Handle cross-platform modifiers
  const cmdOrCtrl = shortcut.modifiers?.cmd || shortcut.modifiers?.ctrl;
  const metaPressed = event.metaKey || event.ctrlKey;
  
  return cmdOrCtrl ? metaPressed : !metaPressed;
}
```

## Accessibility Implementation

### Input Field Awareness

```typescript
// Prevent shortcuts when typing
const target = event.target as HTMLElement;
if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
  return; // Don't trigger shortcuts
}
```

### Focus Management

```typescript
// Proper focus trapping in help modal
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose();
    // Return focus to trigger element
  }
  
  if (event.key === 'Tab') {
    // Manage tab order within modal
  }
}
```

### Screen Reader Support

```svelte
<!-- Proper ARIA labels -->
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="shortcuts-title"
  aria-describedby="shortcuts-description"
>
  <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
  
  <!-- Keyboard display with semantic markup -->
  <kbd aria-label="Command plus N">Cmd + N</kbd>
</div>
```

## Styling System

### Help Modal Styling

```css
.shortcuts-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(46, 52, 64, 0.8);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal);
}

.shortcuts-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}
```

### Keyboard Key Display

```css
kbd {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: var(--font-size-xs);
  background: var(--bg-highest);
  padding: 0.125rem var(--space-xs);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
```

### Help Button Integration

```css
.help-toggle {
  width: 2rem; height: 2rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  transition: background 0.2s ease;
}

.help-toggle:hover {
  background: var(--nord2);
}

.help-icon {
  font-size: 1rem;
  filter: grayscale(1);
  transition: filter 0.2s ease;
}

.help-toggle:hover .help-icon {
  filter: none;
}
```

## Responsive Design

### Mobile Adaptations

```css
@media (max-width: 640px) {
  .shortcuts-content {
    margin: var(--space-sm);
    max-width: none;
  }

  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }

  .shortcut-keys {
    align-self: flex-end;
  }
}
```

### Touch Device Considerations

```svelte
<!-- Show keyboard icon only on devices with keyboards -->
{#if !isTouchDevice}
  <button class="help-toggle">
    <span class="help-icon">⌨️</span>
  </button>
{/if}
```

## Usage Patterns

### Basic Integration

```svelte
<script>
  import { initializeDefaultShortcuts, registerShortcut } from '$lib/stores/keyboard';
  import ShortcutsHelp from '$lib/components/keyboard/ShortcutsHelp.svelte';
  
  let showHelp = false;
  
  onMount(() => {
    initializeDefaultShortcuts();
    
    // Custom shortcut
    registerShortcut({
      id: 'custom-action',
      key: 'x',
      modifiers: { cmd: true },
      description: 'Custom action',
      action: () => console.log('Custom action triggered')
    });
  });
</script>

<ShortcutsHelp bind:isOpen={showHelp} />
```

### Context-Aware Shortcuts

```svelte
<script>
  import { setKeyboardContext } from '$lib/stores/keyboard';
  
  // Update context based on application state
  $: {
    if (showModal) {
      setKeyboardContext('modal');
    } else if (activeProject) {
      setKeyboardContext('kanban');
    } else {
      setKeyboardContext(null);
    }
  }
</script>
```

### Custom Shortcut Categories

```typescript
// Extend default shortcuts with custom categories
registerShortcut({
  id: 'export-data',
  key: 'e',
  modifiers: { cmd: true, shift: true },
  description: 'Export current data',
  action: () => handleExport(),
  context: 'data-view' // Custom context
});
```

## Performance Considerations

### Event Handling Optimization

```typescript
// Debounced key handling for rapid keypresses
let keyTimeout: number;

function handleKeydown(event: KeyboardEvent) {
  clearTimeout(keyTimeout);
  keyTimeout = setTimeout(() => {
    processShortcut(event);
  }, 10);
}
```

### Memory Management

```typescript
// Cleanup shortcuts when component unmounts
onDestroy(() => {
  unregisterShortcut('component-specific-shortcut');
  document.removeEventListener('shortcut:custom', handler);
});
```

### Efficient Shortcut Matching

```typescript
// Pre-compute shortcut maps for faster lookups
const shortcutMap = new Map();
shortcuts.forEach(shortcut => {
  const key = `${shortcut.key}-${JSON.stringify(shortcut.modifiers)}`;
  shortcutMap.set(key, shortcut);
});
```

## Testing Strategy

### Unit Testing Shortcuts

```typescript
// Test shortcut registration
test('registers shortcut correctly', () => {
  const shortcut = { id: 'test', key: 'x', action: vi.fn() };
  registerShortcut(shortcut);
  expect(shortcuts.get()).toContain(shortcut);
});

// Test key matching
test('matches key combination', () => {
  const event = new KeyboardEvent('keydown', { key: 'n', metaKey: true });
  const matches = matchesShortcut(event, { key: 'n', modifiers: { cmd: true } });
  expect(matches).toBe(true);
});
```

### Integration Testing

```typescript
// Test component interaction
test('help modal opens with ? key', async () => {
  render(App);
  fireEvent.keyDown(document, { key: '?' });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

### Accessibility Testing

```typescript
// Test keyboard navigation
test('modal can be closed with Escape', async () => {
  const { getByRole } = render(ShortcutsHelp, { isOpen: true });
  fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
  expect(mockClose).toHaveBeenCalled();
});
```

## Future Enhancement Patterns

### User Customization

```typescript
// Allow users to customize shortcuts
interface CustomShortcut extends KeyboardShortcut {
  userDefined: boolean;
  originalKey?: string;
}

function updateShortcut(id: string, newKey: string) {
  // Save to user preferences
  // Update shortcut registration
}
```

### Shortcut Conflicts Detection

```typescript
function detectConflicts(shortcuts: KeyboardShortcut[]): string[] {
  const conflicts: string[] = [];
  const keyMap = new Map();
  
  shortcuts.forEach(shortcut => {
    const key = formatKeyCombo(shortcut);
    if (keyMap.has(key)) {
      conflicts.push(`Conflict: ${key} assigned to multiple actions`);
    }
    keyMap.set(key, shortcut);
  });
  
  return conflicts;
}
```

### Shortcut Recording

```typescript
// Allow users to record new shortcuts
function startRecording(callback: (keys: string[]) => void) {
  const recordedKeys: string[] = [];
  
  function recordKey(event: KeyboardEvent) {
    recordedKeys.push(event.key);
    // Visual feedback for recording
  }
  
  document.addEventListener('keydown', recordKey);
  // Auto-stop after timeout or completion
}
```

This keyboard system provides a robust foundation for productivity-focused keyboard navigation while maintaining the UNIX philosophy of modularity and composability.