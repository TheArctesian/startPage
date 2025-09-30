# Layout Components Documentation

This directory contains layout and orchestration components following UNIX philosophy: compositional elements that organize and coordinate the application structure.

## Architecture Overview

The main application layout follows a three-zone desktop pattern with responsive mobile adaptation:

```
┌─────────────────────────────────────────────┐
│                Header                       │
│ [☰] [    Timer    ] [Project Badge] [🔗]   │
├─────────────────────────────────────────────┤
│ Projects │     Main Content      │ Links   │
│ Sidebar  │                       │ Sidebar │
│          │    KanbanBoard        │         │
│          │    or Welcome         │         │
│          │                       │         │
└─────────────────────────────────────────────┘
```

## Main Layout Structure (`+page.svelte`)

The primary layout component that orchestrates all other components and manages application state.

### Features
- **Header with Timer**: Persistent timer display across all views
- **Three-Zone Layout**: Projects sidebar, main content, quick links sidebar
- **Responsive Design**: Mobile-first with collapsible sidebars
- **Welcome State**: Onboarding experience for new users
- **Mobile Overlay**: Full-screen modal sidebars on mobile
- **Accessibility**: Full keyboard navigation and screen reader support

### Layout Grid Structure
```css
/* Desktop Layout */
.app-body {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
}

/* Mobile Layout */
@media (max-width: 1024px) {
  .app-body {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
  }
}
```

### Component Integration
- **Timer**: Integrated in header for persistent time tracking
- **ProjectSidebar**: Left sidebar for project navigation and management
- **QuickLinks**: Right sidebar for project-specific resource access
- **KanbanBoard**: Main content area for task management
- **Welcome Screen**: First-time user experience

## UNIX Philosophy Implementation

### Single Responsibility
- Layout component only handles structure and navigation
- Business logic delegated to specialized components
- State management through centralized stores

### Composition Over Inheritance
```svelte
<!-- Composable layout structure -->
<header>
  <Timer />
  <ProjectBadge />
</header>

<main>
  <ProjectSidebar />
  <KanbanBoard />
  <QuickLinks />
</main>
```

### Event-Driven Architecture
```typescript
// Layout handles coordination, components handle specifics
function handleTaskSelect(event: CustomEvent<{ task: TaskWithDetails }>) {
  setSelectedTask(event.detail.task);
}

function handleTaskComplete(event: CustomEvent<{ task: TaskWithDetails }>) {
  // Delegate to completion flow handler
  showIntensityRatingModal(event.detail.task);
}
```

## Responsive Design Strategy

### Breakpoint System
- **Desktop**: `> 1024px` - Full three-column layout
- **Tablet**: `640px - 1024px` - Collapsible sidebars with overlays
- **Mobile**: `< 640px` - Single column with drawer navigation

### Mobile Navigation
```typescript
// Touch-friendly hamburger menu
function toggleProjectSidebar() {
  projectSidebarOpen = !projectSidebarOpen;
}

// Gesture-friendly close behavior
function handleMainClick() {
  if (window.innerWidth <= 1024) {
    projectSidebarOpen = false;
    quickLinksOpen = false;
  }
}
```

### Adaptive Header
- Desktop: Timer + Project Badge + Navigation
- Mobile: Hamburger + Timer + Quick Links Toggle
- Scales gracefully across screen sizes

## State Management Integration

### Global State Dependencies
```typescript
import { 
  activeProject,      // Current project context
  setSelectedTask     // Task selection action
} from '$lib/stores';
```

### Event Coordination
```typescript
// Layout acts as event coordinator between components
<KanbanBoard 
  on:taskSelect={handleTaskSelect}
  on:taskEdit={handleTaskEdit}
  on:taskComplete={handleTaskComplete}
  on:taskDelete={handleTaskDelete}
/>
```

### Reactive Project Display
```svelte
<!-- Header adapts to project selection -->
{#if $activeProject}
  <div class="project-badge">
    <span class="project-icon">{$activeProject.icon}</span>
    <span class="project-name">{$activeProject.name}</span>
  </div>
{:else}
  <div class="no-project">No project selected</div>
{/if}
```

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow: Header → Sidebar → Main → Sidebar
- Arrow keys for component-internal navigation
- Escape key closes mobile sidebars and modals
- Enter/Space activates buttons and links

### Screen Reader Support
```svelte
<!-- Semantic HTML structure -->
<header class="app-header">
  <nav aria-label="Project navigation toggle">
    <button aria-label="Toggle projects sidebar">
  </nav>
</header>

<main role="main" aria-label="Main dashboard content">
  <KanbanBoard />
</main>

<aside aria-label="Quick links sidebar">
  <QuickLinks />
</aside>
```

### Focus Management
- Visible focus indicators on all interactive elements
- Focus trapping in mobile sidebar overlays
- Logical tab order maintained across breakpoints

## Performance Considerations

### Efficient Rendering
```typescript
// Conditional rendering based on screen size
{#if window.innerWidth <= 1024}
  <MobileSidebar />
{:else}
  <DesktopSidebar />
{/if}
```

### Event Optimization
- Debounced resize handlers for responsive behavior
- Event delegation for mobile touch interactions
- Minimal re-renders through reactive stores

### Bundle Optimization
- Lazy loading of heavy components
- CSS-only animations where possible
- Minimal JavaScript for core layout functionality

## Welcome State Design

### First-Time User Experience
```svelte
<!-- Engaging onboarding flow -->
<div class="welcome-state">
  <div class="welcome-content">
    <div class="welcome-icon">🚀</div>
    <h1>Welcome to your Productivity Dashboard</h1>
    <p>Select a project from the sidebar to start tracking tasks and time</p>
    <button onclick={toggleProjectSidebar}>Get Started</button>
  </div>
</div>
```

### Progressive Disclosure
- Clear call-to-action for project creation
- Contextual help and guidance
- Smooth transition to productive state

## Mobile-First Responsive Strategy

### Touch-Friendly Interactions
- Minimum 44px touch targets
- Swipe gestures for sidebar navigation
- Tap-to-close overlay behavior

### Mobile Sidebar Behavior
```css
/* Smooth slide animations */
.sidebar {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.sidebar.mobile-open {
  transform: translateX(0);
}

/* Full-screen overlay for focus */
.mobile-overlay {
  background: rgba(0, 0, 0, 0.5);
  z-index: 15;
}
```

### Responsive Typography
- Fluid font scaling across breakpoints
- Optimized line heights for readability
- Adequate contrast ratios

## Integration Patterns

### Component Coordination
```svelte
<!-- Layout orchestrates but doesn't implement -->
<script>
  // Layout handles routing between components
  function handleTaskEdit(event) {
    selectedTask = event.detail.task;
    showEditModal = true;
  }
  
  function handleProjectSelect(event) {
    setActiveProject(event.detail.project);
    loadProjectTasks(event.detail.project.id);
  }
</script>
```

### Store Integration
```typescript
// Reactive updates trigger layout changes
$: if ($activeProject) {
  // Load project-specific data
  loadProjectQuickLinks($activeProject.id);
  loadProjectTasks($activeProject.id);
}
```

## Future Enhancement Patterns

### Modular Layout System
- Configurable sidebar positions
- Collapsible regions with user preferences
- Customizable header components

### Advanced Responsive Features
- Breakpoint-specific component variants
- Dynamic sidebar width adjustment
- Picture-in-picture timer for mobile

### Performance Optimizations
- Virtual scrolling for large datasets
- Progressive loading of sidebar content
- Intelligent caching of layout state

## Testing Strategy

### Layout Testing
- Responsive behavior across breakpoints
- Sidebar toggle functionality
- Component integration and event flow
- Accessibility compliance

### Integration Testing
- Store state changes trigger correct updates
- Event coordination between components
- Mobile overlay and navigation behavior

This layout system provides a robust foundation for the productivity dashboard while maintaining simplicity and following UNIX principles of modularity and composition.