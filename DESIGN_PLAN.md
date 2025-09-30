# Simplified Productivity Dashboard Design Plan

## Core Concept
A streamlined productivity dashboard focused on accurate time tracking, task intensity assessment, and project organization with quick links.

## Key Features

### 1. Task Management with Time & Intensity Tracking

#### Task Properties
```typescript
interface Task {
  // Core
  id: string;
  title: string;
  description?: string;
  projectId: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  createdAt: Date;
  completedAt?: Date;
  
  // Time Estimation & Tracking
  estimatedMinutes: number;        // Initial estimate
  estimatedIntensity: 1 | 2 | 3 | 4 | 5;  // 1=easy, 5=very intense
  
  // Actual (filled after completion)
  actualMinutes?: number;           // Actual time spent
  actualIntensity?: 1 | 2 | 3 | 4 | 5;    // Actual intensity experienced
  
  // Time tracking sessions
  timeSessions: TimeSession[];     // Toggl-like tracking
  
  // Organization
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  
  // Kanban specific
  boardColumn?: string;
  position?: number;
}

interface TimeSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;  // in seconds
  description?: string;
  isActive: boolean;
}
```

### 2. Project Organization with Quick Links

#### Project Schema
```typescript
interface Project {
  id: string;
  name: string;
  color: string;      // Nord theme color variable
  icon?: string;      // emoji or icon class
  isActive: boolean;
  createdAt: Date;
  
  // Quick Links Sidebar
  quickLinks: QuickLink[];
  
  // Stats
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
}

interface QuickLink {
  id: string;
  projectId: string;
  title: string;
  url: string;
  icon?: string;
  category?: string;  // 'docs' | 'tools' | 'resources' | 'other'
  position: number;   // for ordering
}
```

### 3. Time Tracking System (Toggl-like)

#### Features
- **One-click timer**: Start/stop button for current task
- **Manual entry**: Add time entries after the fact
- **Running timer display**: Shows current session duration
- **Daily/weekly summaries**: Total time per project/task
- **Time reports**: Export time sheets

#### Timer States
```typescript
interface TimerState {
  isRunning: boolean;
  currentTaskId?: string;
  currentSessionId?: string;
  startTime?: Date;
  elapsedSeconds: number;
}

interface TimeEntry {
  id: string;
  taskId?: string;
  projectId: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;  // in seconds
  isManual: boolean;  // manually added vs timer tracked
}
```

## Database Schema

```sql
-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50) DEFAULT '--nord8',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(10) DEFAULT 'medium',
  
  -- Time & Intensity
  estimated_minutes INTEGER NOT NULL,
  estimated_intensity INTEGER CHECK (estimated_intensity BETWEEN 1 AND 5),
  actual_minutes INTEGER,
  actual_intensity INTEGER CHECK (actual_intensity BETWEEN 1 AND 5),
  
  -- Dates
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Kanban
  board_column VARCHAR(100),
  position INTEGER
);

-- Time sessions table (for tracking)
CREATE TABLE time_sessions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER, -- in seconds
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quick links table
CREATE TABLE quick_links (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(50),
  category VARCHAR(50),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(50)
);

-- Task tags junction table
CREATE TABLE task_tags (
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_time_sessions_task ON time_sessions(task_id);
CREATE INDEX idx_time_sessions_active ON time_sessions(is_active);
CREATE INDEX idx_quick_links_project ON quick_links(project_id);
```

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Current Timer | Project Selector | Quick Actions       │
├─────────────┬───────────────────────────────────┬───────────────┤
│             │                                   │               │
│  Projects   │      Main Work Area              │  Quick Links  │
│  Sidebar    │                                   │   Sidebar     │
│             │   ┌──────────────────────┐       │               │
│  □ Work     │   │  Current Task        │       │  📚 Docs      │
│  □ Personal │   │  ⏱ 00:25:30          │       │  → API Docs   │
│  □ Learning │   │  Intensity: ●●●○○    │       │  → Design     │
│             │   └──────────────────────┘       │               │
│  + New      │                                   │  🔧 Tools     │
│             │   Task List / Kanban Board        │  → GitHub     │
│             │                                   │  → Figma      │
│             │   ┌─────────┬─────────┬─────────┐│               │
│             │   │  TODO   │   WIP   │  DONE   ││  🔗 Resources │
│             │   │         │         │         ││  → Slack      │
│             │   │ Task 1  │ Task 3  │ Task 5  ││  → Notion     │
│             │   │ ⏱30m ●●●│ ⏱45m ●●●●│ ✓60m ●●││               │
│             │   │         │         │         ││  + Add Link   │
│             │   │ Task 2  │ Task 4  │         ││               │
│             │   │ ⏱15m ●● │ ⏱90m ●●●●●│        ││               │
│             │   └─────────┴─────────┴─────────┘│               │
└─────────────┴───────────────────────────────────┴───────────────┘
```

## Task Flow

### Creating a Task
1. Click "New Task" or press `Cmd+N`
2. Enter title and description
3. **Set estimated time** (required): 15m, 30m, 1h, 2h, custom
4. **Set estimated intensity** (required): 1-5 scale with visual indicators
5. Optionally add tags, due date, priority
6. Task appears in TODO column

### Working on a Task
1. Click task to expand details
2. Press "Start Timer" or spacebar
3. Timer runs in header (always visible)
4. Can pause/resume as needed
5. Multiple sessions allowed per task

### Completing a Task
1. Click "Complete" or drag to DONE
2. **Required: Rate actual intensity** (1-5)
3. **Timer stops and records actual time**
4. Can manually adjust if needed
5. Stats update automatically

### Review & Learn
- Compare estimated vs actual time
- Compare estimated vs actual intensity
- See patterns over time
- Improve estimation accuracy

## Components Structure

```
src/lib/components/
├── tasks/
│   ├── TaskCard.svelte        # Display with time/intensity badges
│   ├── TaskForm.svelte         # Create/edit with estimations
│   ├── TaskTimer.svelte        # Active timer display
│   └── IntensityPicker.svelte  # 1-5 scale selector
├── projects/
│   ├── ProjectSidebar.svelte   # Project list & selector
│   ├── ProjectStats.svelte     # Time totals, completion rate
│   └── QuickLinks.svelte       # Quick links sidebar
├── timer/
│   ├── TimerDisplay.svelte     # Header timer
│   ├── TimerControls.svelte    # Start/stop/pause
│   └── TimeEntry.svelte        # Manual time entry form
└── layout/
    ├── Header.svelte            # Timer, project selector
    ├── KanbanBoard.svelte       # Three-column board
    └── ListView.svelte          # Alternative list view
```

## Key Interactions

### Keyboard Shortcuts
- `Space` - Start/stop timer for selected task
- `Cmd+N` - New task
- `Cmd+P` - Switch project
- `T` - Focus on timer
- `1-5` - Set intensity when dialog open
- `Cmd+K` - Command palette

### Drag & Drop
- Tasks between kanban columns
- Reorder tasks within columns
- Quick links reordering

### Quick Actions
- Right-click task for context menu
- Bulk select with Shift+Click
- Double-click to edit

## Data Insights

### Accuracy Metrics
```typescript
interface EstimationAccuracy {
  timeAccuracy: number;      // % difference from estimate
  intensityAccuracy: number; // % matches
  improvementTrend: number;  // % over time
}
```

### Daily Summary
- Total time worked
- Tasks completed
- Average intensity
- Time per project
- Estimation accuracy

### Weekly Report
- Total hours
- Project breakdown
- Intensity distribution
- Most productive days
- Estimation improvements

## Implementation Phases

### Phase 1: Core (Week 1)
- Database schema setup
- Basic task CRUD
- Project management
- Simple kanban board

### Phase 2: Time Tracking (Week 2)
- Timer functionality
- Time sessions
- Manual time entry
- Timer display in header

### Phase 3: Intensity & Estimation (Week 3)
- Intensity picker component
- Estimation vs actual comparison
- Review flow after completion
- Accuracy metrics

### Phase 4: Quick Links & Polish (Week 4)
- Quick links sidebar
- Keyboard shortcuts
- Drag & drop
- Data insights dashboard

## Technology Notes

### Frontend State Management
```typescript
// Svelte stores
import { writable, derived } from 'svelte/store';

export const currentTimer = writable<TimerState>({
  isRunning: false,
  elapsedSeconds: 0
});

export const activeProject = writable<Project | null>(null);
export const tasks = writable<Task[]>([]);
export const quickLinks = writable<QuickLink[]>([]);
```

### Real-time Updates
- Use Svelte stores for reactive updates
- Persist timer state to localStorage
- Auto-save task changes
- Sync timer across tabs

### Performance
- Virtual scrolling for long task lists
- Lazy load project data
- Debounced search
- Optimistic UI updates

## Future Enhancements (After MVP)
- Email integration for task creation
- Calendar integration
- API for external tools
- Mobile app
- Team collaboration
- AI-powered time predictions
- Automated time tracking via activity monitoring
- Webhooks for integrations