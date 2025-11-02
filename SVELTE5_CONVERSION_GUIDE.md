# Svelte 5 Runes Conversion Guide

This guide helps convert the remaining 23 Svelte files from legacy `export let` syntax to Svelte 5 runes.

## Files Remaining (23 total)

### UI Components (3)
- `src/lib/ui/modal/form-modal.svelte`
- `src/lib/ui/loading/skeleton-loader.svelte`
- `src/lib/ui/loading/loading-spinner.svelte`

### Task Components (9)
- `src/lib/features/tasks/tasks-view.svelte`
- `src/lib/features/tasks/kanban-column.svelte`
- `src/lib/features/tasks/kanban-board.svelte`
- `src/lib/features/tasks/task-card/task-card.svelte`
- `src/lib/features/tasks/task-card/task-card-draggable.svelte`
- `src/lib/features/tasks/task-view-toolbar.svelte`
- `src/lib/features/tasks/kanban-mobile-nav.svelte`

### Project Components (10)
- `src/lib/features/projects/projects-table.svelte`
- `src/lib/features/projects/projects-grid.svelte`
- `src/lib/features/projects/project-tree/project-tree.svelte`
- `src/lib/features/projects/project-tree/project-tree-node.svelte`
- `src/lib/features/projects/project-sidebar.svelte`
- `src/lib/features/projects/project-row.svelte`
- `src/lib/features/projects/project-status-badge.svelte`
- `src/lib/features/projects/project-status-dropdown.svelte`
- `src/lib/features/projects/project-status-manager.svelte`
- `src/lib/features/projects/modals/quick-link-edit-modal.svelte`
- `src/lib/features/projects/modals/project-create-modal.svelte`

### Analytics (2)
- `src/lib/features/analytics/accuracy-chart.svelte`
- `src/lib/features/analytics/time-chart.svelte`

### Pages (3)
- `src/lib/features/dashboard/home-page.svelte`
- `src/routes/project/[id]/+page.svelte`
- `src/routes/admin/+page.svelte`

---

## Conversion Patterns

### Pattern 1: Simple Props (Read-only)

**Before:**
```svelte
<script lang="ts">
  export let title: string = 'Default';
  export let count: number;
  export let optional = true;
</script>
```

**After:**
```svelte
<script lang="ts">
  let {
    title = 'Default',
    count,
    optional = true
  } = $props<{
    title?: string;
    count: number;
    optional?: boolean;
  }>();
</script>
```

### Pattern 2: Props with Two-Way Binding

**Before:**
```svelte
<script lang="ts">
  export let value: string = '';
  export let selected: boolean = false;
</script>
```

**After:**
```svelte
<script lang="ts">
  let {
    value = $bindable(''),
    selected = $bindable(false)
  } = $props<{
    value?: string;
    selected?: boolean;
  }>();
</script>
```

**Use `$bindable()` when:**
- The prop is used with `bind:` in parent components
- The component mutates the prop value
- Common examples: `value`, `checked`, `selected`, `isOpen`

### Pattern 3: Event Dispatchers

**Before:**
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let data: any;

  const dispatch = createEventDispatcher<{
    save: { id: number };
    cancel: void;
  }>();

  function handleSave() {
    dispatch('save', { id: 123 });
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<button on:click={handleSave}>Save</button>
<button on:click={handleCancel}>Cancel</button>
```

**After:**
```svelte
<script lang="ts">
  let {
    data,
    onsave,
    oncancel
  } = $props<{
    data: any;
    onsave?: (event: { id: number }) => void;
    oncancel?: () => void;
  }>();

  function handleSave() {
    onsave?.({ id: 123 });
  }

  function handleCancel() {
    oncancel?.();
  }
</script>

<button onclick={handleSave}>Save</button>
<button onclick={handleCancel}>Cancel</button>
```

### Pattern 4: Rest Props ($$restProps)

**Before:**
```svelte
<script lang="ts">
  export let variant: string = 'default';
  export let size: string = 'md';
</script>

<div class="component-{variant}" {...$$restProps}>
  <slot />
</div>
```

**After:**
```svelte
<script lang="ts">
  let {
    variant = 'default',
    size = 'md',
    ...restProps
  } = $props<{
    variant?: string;
    size?: string;
    [key: string]: any;
  }>();
</script>

<div class="component-{variant}" {...restProps}>
  <slot />
</div>
```

### Pattern 5: Event Handlers as Props

**Before:**
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<button on:click on:mouseenter on:focus>
  <slot />
</button>
```

**After:**
```svelte
<script lang="ts">
  let {
    onclick,
    onmouseenter,
    onfocus,
    ...restProps
  } = $props<{
    onclick?: (event: MouseEvent) => void;
    onmouseenter?: (event: MouseEvent) => void;
    onfocus?: (event: FocusEvent) => void;
    [key: string]: any;
  }>();
</script>

<button {onclick} {onmouseenter} {onfocus} {...restProps}>
  <slot />
</button>
```

### Pattern 6: Template Event Binding

**Before:**
```svelte
<button on:click={handleClick}>Click</button>
<input on:input={handleInput} on:change={handleChange} />
<svelte:window on:keydown={handleKeydown} />
```

**After:**
```svelte
<button onclick={handleClick}>Click</button>
<input oninput={handleInput} onchange={handleChange} />
<svelte:window onkeydown={handleKeydown} />
```

---

## Step-by-Step Conversion Process

For each file:

### Step 1: Identify Export Props
```bash
# View all export let lines in a file
grep -n "^\s*export let" src/lib/ui/modal/form-modal.svelte
```

### Step 2: Identify Which Props Need $bindable
Props need `$bindable()` if they are:
- Used with `bind:` directive in parent components
- Mutated within the component (e.g., `isOpen = false`)
- Common bindable props: `value`, `checked`, `selected`, `isOpen`, `expanded`

### Step 3: Identify Event Dispatchers
```bash
# Check for createEventDispatcher
grep -n "createEventDispatcher" src/lib/ui/modal/form-modal.svelte

# Check for dispatch calls
grep -n "dispatch(" src/lib/ui/modal/form-modal.svelte
```

### Step 4: Convert the Script Block

Example conversion for `form-modal.svelte`:

**Before:**
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isOpen: boolean = false;
  export let title: string = '';
  export let submitLabel: string = 'Submit';
  export let cancelLabel: string = 'Cancel';
  export let submitting: boolean = false;

  const dispatch = createEventDispatcher<{
    submit: void;
    cancel: void;
  }>();

  function handleSubmit() {
    dispatch('submit');
  }

  function handleCancel() {
    isOpen = false;
    dispatch('cancel');
  }
</script>
```

**After:**
```svelte
<script lang="ts">
  let {
    isOpen = $bindable(false),
    title = '',
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    submitting = false,
    onsubmit,
    oncancel
  } = $props<{
    isOpen?: boolean;
    title?: string;
    submitLabel?: string;
    cancelLabel?: string;
    submitting?: boolean;
    onsubmit?: () => void;
    oncancel?: () => void;
  }>();

  function handleSubmit() {
    onsubmit?.();
  }

  function handleCancel() {
    isOpen = false;
    oncancel?.();
  }
</script>
```

### Step 5: Update Template Event Bindings

Replace all `on:event` with `onevent`:
- `on:click` → `onclick`
- `on:input` → `oninput`
- `on:change` → `onchange`
- `on:submit` → `onsubmit`
- `on:keydown` → `onkeydown`
- `on:mouseenter` → `onmouseenter`
- etc.

### Step 6: Update $$restProps

Replace `{...$$restProps}` with `{...restProps}` and include in $props destructuring.

---

## Common Mistakes to Avoid

### ❌ Don't forget TypeScript types
```svelte
<!-- BAD -->
let { title, count } = $props();

<!-- GOOD -->
let { title, count } = $props<{ title: string; count: number }>();
```

### ❌ Don't use $bindable for read-only props
```svelte
<!-- BAD - title is read-only -->
let { title = $bindable('Default') } = $props();

<!-- GOOD -->
let { title = 'Default' } = $props();
```

### ❌ Don't forget optional (?) for props with defaults
```svelte
<!-- BAD - TypeScript error -->
let { title = 'Default' } = $props<{ title: string }>();

<!-- GOOD -->
let { title = 'Default' } = $props<{ title?: string }>();
```

### ❌ Don't use createEventDispatcher anymore
```svelte
<!-- BAD - old Svelte 4 pattern -->
const dispatch = createEventDispatcher();
dispatch('click', data);

<!-- GOOD - Svelte 5 pattern -->
let { onclick } = $props<{ onclick?: (data: any) => void }>();
onclick?.(data);
```

---

## Quick Reference: Event Name Mappings

| Old (on:) | New (on) |
|-----------|----------|
| `on:click` | `onclick` |
| `on:input` | `oninput` |
| `on:change` | `onchange` |
| `on:submit` | `onsubmit` |
| `on:keydown` | `onkeydown` |
| `on:keyup` | `onkeyup` |
| `on:keypress` | `onkeypress` |
| `on:focus` | `onfocus` |
| `on:blur` | `onblur` |
| `on:mouseenter` | `onmouseenter` |
| `on:mouseleave` | `onmouseleave` |
| `on:mousedown` | `onmousedown` |
| `on:mouseup` | `onmouseup` |
| `on:drag` | `ondrag` |
| `on:dragstart` | `ondragstart` |
| `on:dragend` | `ondragend` |
| `on:dragover` | `ondragover` |
| `on:drop` | `ondrop` |

---

## Validation Checklist

After converting a file:

- [ ] No `export let` statements remain
- [ ] All props use `$props<Types>()`
- [ ] Two-way bound props use `$bindable()`
- [ ] No `createEventDispatcher` imports
- [ ] No `dispatch()` calls
- [ ] Event handlers are props (e.g., `onclick`)
- [ ] Template uses `onevent` not `on:event`
- [ ] `$$restProps` replaced with `...restProps`
- [ ] TypeScript types are complete
- [ ] Optional props marked with `?`
- [ ] File runs without errors: `yarn check`

---

## Testing After Conversion

```bash
# Type check
yarn check

# Run dev server and test the component
yarn dev

# Check for any Svelte compiler warnings
# Look for lines mentioning "runes mode" or "export let"
```

---

## Example: Complete Conversion

### Before: `skeleton-loader.svelte`
```svelte
<script lang="ts">
  export let variant: 'text' | 'circular' | 'rectangular' = 'text';
  export let width: string | number = '100%';
  export let height: string | number = 20;
  export let count: number = 1;
</script>

<div class="skeleton-container">
  {#each Array(count) as _}
    <div
      class="skeleton skeleton-{variant}"
      style="width: {typeof width === 'number' ? width + 'px' : width}; height: {typeof height === 'number' ? height + 'px' : height}"
    />
  {/each}
</div>

<style>
  .skeleton {
    background: linear-gradient(90deg, var(--nord2) 25%, var(--nord3) 50%, var(--nord2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
```

### After: `skeleton-loader.svelte`
```svelte
<script lang="ts">
  let {
    variant = 'text',
    width = '100%',
    height = 20,
    count = 1
  } = $props<{
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
  }>();
</script>

<div class="skeleton-container">
  {#each Array(count) as _}
    <div
      class="skeleton skeleton-{variant}"
      style="width: {typeof width === 'number' ? width + 'px' : width}; height: {typeof height === 'number' ? height + 'px' : height}"
    />
  {/each}
</div>

<style>
  .skeleton {
    background: linear-gradient(90deg, var(--nord2) 25%, var(--nord3) 50%, var(--nord2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
```

Changes:
1. Replaced all `export let` with `$props()` destructuring
2. Added TypeScript types
3. Made all props optional (with `?`) since they have defaults
4. No event handlers needed (component has no events)
5. No `$bindable()` needed (no two-way binding)

---

## Conversion Priority Order

**Start with simplest first:**
1. Loading components (skeleton-loader, loading-spinner)
2. Simple display components (badges, status components)
3. Form components (modals with events)
4. Complex interactive components (kanban, tree)
5. Page components last (largest, most complex)

Good luck! After converting each file, run `yarn check` to verify no type errors.
