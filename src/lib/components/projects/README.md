# Projects Components Documentation

This directory contains project management and navigation components following UNIX philosophy: focused, composable modules for project organization.

## Files Overview

### `ProjectSidebar.svelte` - Project Navigation & Management
Collapsible sidebar for project selection, creation, and statistics display.

**Features:**
- Project list with statistics (tasks completed, time spent)
- Visual progress bars and completion rates
- Project creation modal with color/icon selection
- Collapsible design for space efficiency
- Active project highlighting
- Empty state handling
- Project switching with automatic data loading

**Props:**
- No props - uses global store state

**Events:**
- `projectSelect` - Project selected from list
- `projectCreate` - New project created
- `projectEdit` - Project edit requested

**Key Features:**
```typescript
// Project display with stats
interface ProjectDisplay {
  name: string;
  icon?: string;
  color: string;
  totalTasks: number;
  completedTasks: number;
  totalMinutes: number;
  completionRate: number; // calculated percentage
}
```

### `QuickLinks.svelte` - Project-Specific Links Management
Context-aware sidebar for managing and accessing project resources.

**Features:**
- Category-organized links (Docs, Tools, Resources, Other)
- Project-specific link collections
- Link creation with URL validation
- Icon suggestions per category
- Collapsible design with quick access
- Domain extraction for clean display
- External link handling (opens in new tab)

**Props:**
- No props - uses global store state

**Events:**
- `linkClick` - Link opened
- `linkEdit` - Link edit requested
- `linkDelete` - Link deletion requested

**Category System:**
```typescript
const categories = [
  { id: 'docs', name: 'Documentation', icon: '📚', color: 'var(--nord8)' },
  { id: 'tools', name: 'Tools', icon: '🔧', color: 'var(--nord9)' },
  { id: 'resources', name: 'Resources', icon: '🔗', color: 'var(--nord10)' },
  { id: 'other', name: 'Other', icon: '📎', color: 'var(--nord4)' }
];
```

## Architecture Principles

### UNIX Philosophy Implementation

1. **Single Responsibility:**
   - `ProjectSidebar` - Project navigation and management only
   - `QuickLinks` - Link management and access only

2. **Modular Design:**
   - Each sidebar can be used independently
   - Shared modal patterns for consistency
   - Composable with any main content area

3. **Data Separation:**
   - Components consume store data reactively
   - No direct API calls in components
   - Events bubble up for business logic handling

### State Management Integration

#### Store Dependencies
```typescript
// ProjectSidebar uses:
import { 
  projects,           // All available projects
  activeProject,      // Currently selected project
  projectStats,       // Projects with computed statistics
  setActiveProject,   // Action to switch projects
  createProject       // Action to create new project
} from '$lib/stores';

// QuickLinks uses:
import {
  activeProject,              // Current project context
  activeProjectQuickLinks,    // Links for current project
  createQuickLink            // Action to create new link
} from '$lib/stores';
```

#### Reactive Data Flow
```typescript
// ProjectSidebar reactivity
$: allProjects = $projects;           // Raw project list
$: currentProject = $activeProject;   // Active selection
$: statsData = $projectStats;         // Projects with stats

// QuickLinks reactivity  
$: currentProject = $activeProject;   // Project context
$: projectLinks = $activeProjectQuickLinks; // Filtered links
$: linksByCategory = groupLinksByCategory(projectLinks); // Organized display
```

## Component Integration Patterns

### Layout Integration
```svelte
<div class="app-layout">
  <!-- Left sidebar for projects -->
  <ProjectSidebar 
    on:projectSelect={handleProjectSelect}
    on:projectCreate={handleProjectCreate}
  />
  
  <!-- Main content area -->
  <main class="main-content">
    <KanbanBoard />
  </main>
  
  <!-- Right sidebar for quick links -->
  <QuickLinks 
    on:linkClick={handleLinkClick}
    on:linkEdit={handleLinkEdit}
  />
</div>
```

### Responsive Behavior
```css
/* Mobile: Overlay sidebars */
@media (max-width: 1024px) {
  .project-sidebar,
  .quicklinks-sidebar {
    position: fixed;
    z-index: 100;
    transform: translateX(-100%); /* or 100% for right */
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}
```

### Collapse State Management
```typescript
// Sidebars can be collapsed independently
let projectSidebarCollapsed = false;
let quickLinksSidebarCollapsed = false;

// Responsive auto-collapse
$: if (screenWidth < 1024) {
  projectSidebarCollapsed = true;
  quickLinksSidebarCollapsed = true;
}
```

## Modal Patterns

### Project Creation Modal
```svelte
<!-- Triggered from ProjectSidebar -->
<div class="modal-backdrop">
  <form class="project-form">
    <!-- Name input -->
    <input bind:value={projectName} required />
    
    <!-- Icon selection grid -->
    <div class="icon-grid">
      {#each iconSuggestions as icon}
        <button type="button" onclick={() => setIcon(icon)}>
          {icon}
        </button>
      {/each}
    </div>
    
    <!-- Color selection -->
    <div class="color-grid">
      {#each colorOptions as color}
        <button 
          type="button"
          style="background: {color.bg}"
          onclick={() => selectColor(color.value)}
        />
      {/each}
    </div>
    
    <!-- Live preview -->
    <div class="preview">
      <ProjectBadge name={projectName} icon={selectedIcon} color={selectedColor} />
    </div>
  </form>
</div>
```

### Quick Link Creation Modal
```svelte
<!-- Triggered from QuickLinks -->
<div class="modal-backdrop">
  <form class="link-form">
    <!-- URL with validation -->
    <input 
      type="url" 
      bind:value={linkUrl}
      class:valid={isValidUrl(linkUrl)}
      class:invalid={linkUrl && !isValidUrl(linkUrl)}
    />
    
    <!-- Category selection -->
    <div class="category-grid">
      {#each categories as category}
        <button 
          type="button"
          class:selected={selectedCategory === category.id}
          onclick={() => selectCategory(category.id)}
        >
          <span style="color: {category.color}">{category.icon}</span>
          {category.name}
        </button>
      {/each}
    </div>
    
    <!-- Icon suggestions based on category -->
    <div class="icon-suggestions">
      {#each iconSuggestions[selectedCategory] as icon}
        <button onclick={() => setIcon(icon)}>{icon}</button>
      {/each}
    </div>
  </form>
</div>
```

## User Experience Features

### ProjectSidebar UX
1. **Visual Feedback:**
   - Progress bars for task completion
   - Color-coded project indicators
   - Active state highlighting

2. **Quick Actions:**
   - One-click project switching
   - Inline project creation
   - Collapse for space saving

3. **Information Density:**
   - Compact stats display
   - Essential metrics only
   - Progressive disclosure

### QuickLinks UX
1. **Contextual Organization:**
   - Category-based grouping
   - Project-specific collections
   - Smart icon suggestions

2. **Efficient Access:**
   - External link opening
   - Keyboard shortcuts
   - Quick domain display

3. **Management Tools:**
   - In-place editing
   - Drag & drop reordering (future)
   - Bulk operations (future)

## Data Validation

### Project Validation
```typescript
interface ProjectValidation {
  name: {
    required: true;
    minLength: 1;
    maxLength: 255;
  };
  color: {
    format: 'css-variable'; // --nord8 format
  };
  icon: {
    maxLength: 10; // Emoji or short string
  };
}
```

### Quick Link Validation
```typescript
interface QuickLinkValidation {
  title: {
    required: true;
    minLength: 1;
    maxLength: 255;
  };
  url: {
    required: true;
    format: 'url'; // Valid HTTP/HTTPS URL
  };
  category: {
    enum: ['docs', 'tools', 'resources', 'other'];
  };
}

// URL normalization
function normalizeUrl(input: string): string {
  if (!input.startsWith('http')) {
    return `https://${input}`;
  }
  return input;
}
```

## Performance Optimizations

### Efficient Rendering
```typescript
// Virtual scrolling for large project lists
{#each visibleProjects as project (project.id)}
  <ProjectItem {project} />
{/each}

// Lazy loading for project statistics
{#await loadProjectStats(project.id)}
  <ProjectSkeleton />
{:then stats}
  <ProjectStats {stats} />
{/await}
```

### Smart Data Loading
```typescript
// Load quick links only for active project
$: if (activeProject) {
  loadQuickLinks(activeProject.id);
}

// Debounced search/filter
const debouncedFilter = debounce(filterProjects, 300);
```

### Memory Management
- Cleanup intervals on component destroy
- Unsubscribe from stores properly
- Avoid memory leaks in modal handling

## Accessibility Implementation

### Keyboard Navigation
```typescript
// ProjectSidebar keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    selectNextProject();
  } else if (event.key === 'ArrowUp') {
    selectPreviousProject();
  } else if (event.key === 'Enter') {
    activateSelectedProject();
  }
}
```

### Screen Reader Support
```svelte
<!-- Semantic structure -->
<nav aria-label="Project navigation">
  <h2 id="projects-heading">Projects</h2>
  <ul role="list" aria-labelledby="projects-heading">
    {#each projects as project}
      <li role="listitem">
        <button 
          aria-label="Select {project.name} project"
          aria-pressed={isActive}
        >
          {project.name}
        </button>
      </li>
    {/each}
  </ul>
</nav>
```

### Focus Management
```typescript
// Modal focus trapping
function trapFocus(modal: HTMLElement) {
  const focusableElements = modal.querySelectorAll(
    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Focus management logic...
}
```

## Future Enhancements

### Advanced Features
1. **Project Templates:** Pre-configured project setups
2. **Bulk Operations:** Multi-select and batch actions
3. **Project Sharing:** Collaboration features
4. **Advanced Filtering:** Search, tags, date ranges
5. **Drag & Drop:** Project and link reordering
6. **Favorites:** Star frequently used links
7. **Recent Projects:** Quick access to recent work
8. **Project Archives:** Inactive project management

### Integration Possibilities
1. **External Services:** GitHub, GitLab, Figma integrations
2. **Bookmark Sync:** Browser bookmark synchronization
3. **Team Features:** Shared project spaces
4. **API Webhooks:** External system notifications
5. **Mobile Apps:** Native mobile companions

This component system provides a comprehensive project management interface that scales from personal use to team collaboration while maintaining simplicity and performance.