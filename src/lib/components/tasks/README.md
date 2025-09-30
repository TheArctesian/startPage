# Tasks Components Documentation

This directory contains task-related UI components following UNIX philosophy: focused, modular components that compose well together.

## Architecture Overview

```
src/lib/components/tasks/
├── TaskCard.svelte           # Individual task display with badges
├── TaskForm.svelte           # Create/edit task modal form
├── TaskCompletionModal.svelte # Task completion with actual intensity rating
├── KanbanBoard.svelte        # Drag & drop board layout
└── README.md                 # This documentation
```

## Files Overview

### `TaskCard.svelte` - Task Display Component
Versatile task display component with multiple variants and interactive features.

**Features:**
- Multiple variants: `compact`, `detailed`, `kanban`
- Time tracking integration with timer controls
- Intensity level visualization (estimated vs actual)
- Status indicators with color coding
- Due date display with overdue highlighting
- Drag & drop support for Kanban boards
- Action buttons (edit, complete, delete)
- Project information display
- Priority indicators

**Props:**
```typescript
export let task: TaskWithDetails;                    // Task data with relations
export let variant: 'compact' | 'detailed' | 'kanban' = 'detailed'; // Display style
export let selectable: boolean = false;             // Click to select
export let selected: boolean = false;               // Selected state
export let showTimer: boolean = true;               // Show timer controls
export let showProject: boolean = false;            // Show project name
export let draggable: boolean = false;              // Enable drag & drop
```

**Events:**
- `select` - Task clicked (when selectable)
- `edit` - Edit button clicked
- `complete` - Complete button clicked
- `delete` - Delete button clicked
- `dragstart` - Drag operation started
- `dragend` - Drag operation ended

### `TaskForm.svelte` - Task Creation/Editing Modal
Comprehensive form component for creating and editing tasks with validation.

**Features:**
- Create new tasks or edit existing ones
- Time estimation with quick presets
- Intensity level selection (1-5 scale)
- Project selection dropdown
- Priority and due date setting
- Form validation with error messages
- Keyboard shortcuts (Ctrl+Enter to submit, Esc to close)
- Autofocus and accessibility support
- Responsive design

**Props:**
```typescript
export let task: Task | null = null;                // null = create, Task = edit
export let isOpen: boolean = false;                 // Modal visibility
export let autoFocus: boolean = true;               // Focus first input
```

**Events:**
- `submit` - Form submitted successfully
- `cancel` - Form cancelled
- `close` - Modal closed (ESC key)

### `KanbanBoard.svelte` - Drag & Drop Task Board
Interactive Kanban board with three columns and drag & drop functionality.

**Features:**
- Three columns: To Do, In Progress, Done
- Drag & drop task reordering and status changes
- Column statistics (task count, total time)
- Empty state handling
- Add task buttons per column
- Task filtering by status
- Responsive design with mobile fallback

**Events:**
- `taskSelect` - Task card clicked
- `taskEdit` - Task edit requested
- `taskComplete` - Task completion requested
- `taskDelete` - Task deletion requested

## Architecture Principles

### UNIX Philosophy Implementation

1. **Single Responsibility:**
   - `TaskCard` - Display task information only
   - `TaskForm` - Handle task creation/editing only
   - `KanbanBoard` - Manage board layout and drag & drop only

2. **Composability:**
   - TaskCard works in lists, boards, search results
   - TaskForm can be triggered from multiple places
   - KanbanBoard orchestrates TaskCard components

3. **Data Flow:**
   - Components receive props and emit events
   - No direct store mutations in components
   - Events bubble up to parent for handling

### Design Patterns

#### Variant System
```typescript
// TaskCard supports multiple display contexts
<TaskCard {task} variant="compact" />      // For lists
<TaskCard {task} variant="detailed" />     // For main view
<TaskCard {task} variant="kanban" />       // For boards
```

#### Event-Driven Architecture
```typescript
// Parent handles all business logic
<KanbanBoard 
  on:taskComplete={handleTaskComplete}
  on:taskEdit={openEditForm}
  on:taskDelete={confirmDelete}
/>
```

#### Progressive Enhancement
- Basic functionality works without JavaScript
- Enhanced features layer on top
- Graceful degradation for older browsers

## Integration Patterns

### TaskCard in Different Contexts

```svelte
<!-- In a task list -->
{#each tasks as task}
  <TaskCard 
    {task} 
    variant="compact"
    selectable={true}
    on:select={selectTask}
  />
{/each}

<!-- In Kanban board -->
<TaskCard 
  {task} 
  variant="kanban"
  draggable={true}
  showTimer={task.status !== 'done'}
  on:dragstart={handleDragStart}
/>

<!-- In task details view -->
<TaskCard 
  {task} 
  variant="detailed"
  showProject={true}
  showTimer={true}
/>
```

### TaskForm Usage Patterns

```svelte
<!-- Create new task -->
<TaskForm 
  bind:isOpen={showCreateForm}
  on:submit={handleTaskCreated}
  on:cancel={() => showCreateForm = false}
/>

<!-- Edit existing task -->
<TaskForm 
  bind:isOpen={showEditForm}
  task={selectedTask}
  on:submit={handleTaskUpdated}
/>
```

### `TaskCompletionModal.svelte` - Completion Flow Component

**Purpose**: Collects actual intensity rating and time tracking when tasks are completed, enabling estimation accuracy analysis.

**Features:**
- Actual intensity rating (1-5 scale) input
- Actual time spent input with estimation comparison
- Real-time accuracy feedback (time and intensity)
- Optional reflection notes
- Visual completion summary with accuracy percentages
- Keyboard shortcuts support (Cmd+Enter to submit, Escape to cancel)
- Loading states and error handling
- Responsive design with mobile adaptations

**Props:**
```typescript
export let isOpen: boolean = false;
export let task: TaskWithDetails | null = null;
```

**Events:**
```typescript
interface CompletionEvents {
  complete: { 
    task: TaskWithDetails; 
    actualIntensity: number; 
    timeSpent?: number; 
  };
  cancel: void;
}
```

**Usage Pattern:**
```svelte
<script>
  import TaskCompletionModal from './TaskCompletionModal.svelte';
  
  let showCompletion = false;
  let taskToComplete = null;
  
  function handleTaskComplete(event) {
    taskToComplete = event.detail.task;
    showCompletion = true;
  }
  
  async function handleCompleted(event) {
    const { task, actualIntensity, timeSpent } = event.detail;
    
    // Update task with actual values
    await fetch(`/api/tasks/${task.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        actualIntensity,
        actualMinutes: timeSpent,
        status: 'done'
      })
    });
    
    showCompletion = false;
    // Refresh task list
  }
</script>

<TaskCompletionModal
  bind:isOpen={showCompletion}
  task={taskToComplete}
  on:complete={handleCompleted}
  on:cancel={() => showCompletion = false}
/>
```

**Estimation Accuracy Calculation:**
```typescript
// Time accuracy: How close actual time was to estimate
const timeAccuracy = estimatedMinutes > 0 ? 
  Math.round((1 - Math.abs(timeDifference) / estimatedMinutes) * 100) : 0;

// Intensity accuracy: How close actual intensity was to estimate  
const intensityDifference = Math.abs(actualIntensity - estimatedIntensity);
const intensityAccuracy = Math.round((1 - intensityDifference / 4) * 100);
```

### KanbanBoard Integration

```svelte
<script>
  import KanbanBoard from './KanbanBoard.svelte';
  import { completeTask, updateTask } from '$lib/stores';

  async function handleTaskComplete(event) {
    const { task } = event.detail;
    // Show intensity rating modal
    await completeTask(task.id, actualIntensity);
  }

  async function handleTaskEdit(event) {
    const { task } = event.detail;
    selectedTask = task;
    showEditForm = true;
  }
</script>

<KanbanBoard 
  on:taskComplete={handleTaskComplete}
  on:taskEdit={handleTaskEdit}
  on:taskDelete={handleTaskDelete}
  on:taskSelect={setSelectedTask}
/>
```

## State Management Integration

### Store Actions Used
```typescript
// From stores/actions.ts
import { 
  createTask,     // TaskForm submissions
  updateTask,     // TaskCard updates, drag & drop
  completeTask,   // Task completion with intensity
  setSelectedTask // Task selection
} from '$lib/stores';
```

### Reactive Data Sources
```typescript
// From stores/index.ts
import {
  todoTasks,        // KanbanBoard TODO column
  inProgressTasks,  // KanbanBoard WIP column  
  doneTasks,        // KanbanBoard DONE column
  activeProject,    // TaskForm project selection
  selectedTask      // TaskCard selection state
} from '$lib/stores';
```

## Styling System

### CSS Architecture
- Component-scoped styles using Svelte's `<style>` blocks
- Nord theme color variables for consistency
- Responsive design with mobile-first approach
- Accessibility-compliant focus styles

### Color Coding System
```css
/* Status colors */
--status-todo: var(--nord4);
--status-progress: var(--nord8);
--status-done: var(--nord14);
--status-archived: var(--nord3);

/* Priority colors */
--priority-low: var(--nord4);
--priority-medium: var(--nord8);
--priority-high: var(--nord12);

/* Due date colors */
--due-overdue: var(--nord11);
--due-today: var(--nord12);
--due-soon: var(--nord13);
--due-later: var(--nord4);
```

### Responsive Breakpoints
- Mobile: < 640px (single column, touch-friendly)
- Tablet: 640px - 1024px (adapted layouts)
- Desktop: > 1024px (full features)

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow
- Arrow keys for intensity selection
- Enter/Space for button activation
- Escape to close modals

### Screen Reader Support
- ARIA labels for all interactive elements
- Role attributes for complex widgets
- Live regions for dynamic content
- Semantic HTML structure

### Visual Accessibility
- High contrast mode support
- Reduced motion preferences respected
- Color-independent information display
- Focus indicators clearly visible

## Performance Considerations

### Optimization Strategies
1. **Virtual Scrolling** - For large task lists
2. **Event Delegation** - Efficient event handling
3. **Lazy Loading** - Images and heavy content
4. **Debounced Updates** - Form inputs and filters

### Bundle Size Management
- Tree-shakeable component exports
- Minimal external dependencies
- Shared styling through CSS variables
- Code splitting for modal components

## Testing Strategy

### Unit Tests
- Component rendering with different props
- Event emission and handling
- Form validation logic
- Drag & drop functionality

### Integration Tests
- Store action integration
- Cross-component communication
- Form submission workflows
- Keyboard navigation flows

### Accessibility Tests
- Screen reader compatibility
- Keyboard-only navigation
- Color contrast compliance
- Focus management

## Common Usage Patterns

### Task Management Workflow
```svelte
<script>
  let selectedTask = null;
  let showEditForm = false;
  let showCreateForm = false;

  function handleTaskSelect(event) {
    selectedTask = event.detail.task;
  }

  function handleTaskEdit(event) {
    selectedTask = event.detail.task;
    showEditForm = true;
  }

  function handleNewTask() {
    selectedTask = null;
    showCreateForm = true;
  }
</script>

<!-- Task board with all interactions -->
<KanbanBoard 
  on:taskSelect={handleTaskSelect}
  on:taskEdit={handleTaskEdit}
/>

<!-- Forms for CRUD operations -->
<TaskForm 
  bind:isOpen={showCreateForm}
  task={null}
  on:submit={() => showCreateForm = false}
/>

<TaskForm 
  bind:isOpen={showEditForm}
  task={selectedTask}
  on:submit={() => showEditForm = false}
/>
```

### Search and Filter Integration
```svelte
<!-- Filtered task display -->
{#each filteredTasks as task}
  <TaskCard 
    {task}
    variant="compact"
    selectable={true}
    selected={selectedTask?.id === task.id}
    on:select={handleTaskSelect}
  />
{/each}
```

This component system provides a complete task management interface that's both powerful and maintainable, following UNIX principles while delivering excellent user experience.