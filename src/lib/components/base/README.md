# Base Components

Atomic UI components following the UNIX philosophy - each component does one thing well.

## Components

### Button.svelte
A versatile button component with multiple variants and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean (default: false)
- `loading`: boolean (default: false)
- `fullWidth`: boolean (default: false)

**Usage:**
```svelte
<Button variant="primary" size="md" on:click={handleClick}>
  Save Changes
</Button>
```

### Card.svelte
A flexible container component with consistent styling.

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `interactive`: boolean - adds hover effects (default: false)

**Usage:**
```svelte
<Card variant="elevated" padding="lg" interactive>
  <slot />
</Card>
```

### Modal.svelte
A reusable modal wrapper handling overlay, positioning, and animations.

**Props:**
- `isOpen`: boolean (required)
- `title`: string (optional)
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `closeOnOverlay`: boolean (default: true)
- `showClose`: boolean (default: true)

**Events:**
- `close`: Fired when modal requests to close

**Usage:**
```svelte
<Modal bind:isOpen={showModal} title="Edit Task" on:close={handleClose}>
  <div slot="body">Modal content here</div>
  <div slot="footer">Footer buttons</div>
</Modal>
```

### Badge.svelte
A small label component for status indicators and metadata.

**Props:**
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'error' (default: 'default')
- `size`: 'xs' | 'sm' | 'md' (default: 'sm')
- `rounded`: boolean (default: true)

**Usage:**
```svelte
<Badge variant="success" size="sm">
  Completed
</Badge>
```

## Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composability**: Components can be combined to create complex UIs
3. **Consistency**: All components follow the Nord theme
4. **Accessibility**: ARIA attributes and keyboard support built-in
5. **Performance**: Minimal dependencies and optimized rendering

## Styling

All base components use CSS variables from the Nord theme:
- Colors from `nord-theme.css`
- Spacing, borders, and shadows from CSS variables
- Animations use standardized timing functions

## Testing

Each component should have:
- Unit tests for props and events
- Visual regression tests for different states
- Accessibility tests for ARIA compliance