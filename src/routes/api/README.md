# API Routes Documentation

This directory contains all API endpoints for the productivity dashboard backend.

## Structure

```
api/
├── projects/              # Project management endpoints
│   ├── +server.ts        # GET /api/projects (list), POST /api/projects (create)
│   └── [id]/
│       └── +server.ts    # GET/PUT/DELETE /api/projects/:id
├── tasks/                 # Task management endpoints  
│   ├── +server.ts        # GET /api/tasks (list), POST /api/tasks (create)
│   └── [id]/
│       ├── +server.ts    # GET/PUT/DELETE /api/tasks/:id
│       └── complete/
│           └── +server.ts # POST /api/tasks/:id/complete
├── time-sessions/         # Time tracking endpoints
│   ├── +server.ts        # GET /api/time-sessions (list), POST /api/time-sessions (create)
│   ├── [id]/
│   │   └── +server.ts    # GET/PUT/DELETE /api/time-sessions/:id
│   ├── start/
│   │   └── +server.ts    # POST /api/time-sessions/start
│   ├── stop/
│   │   └── +server.ts    # POST /api/time-sessions/stop
│   └── active/
│       └── +server.ts    # GET /api/time-sessions/active
└── quick-links/           # Quick links management
    ├── +server.ts        # GET /api/quick-links (list), POST /api/quick-links (create)
    └── [id]/
        └── +server.ts    # GET/PUT/DELETE /api/quick-links/:id
```

## Projects API

### `GET /api/projects`
Lists all projects with optional stats.

**Query Parameters:**
- `stats=true` - Include task counts and time totals
- `active=false` - Include inactive projects (default: active only)

### `POST /api/projects`
Creates a new project.

**Body:**
```typescript
{
  name: string;        // Required, 1-255 chars
  color?: string;      // CSS color variable, default: --nord8  
  icon?: string;       // Emoji or icon class
  isActive?: boolean;  // Default: true
}
```

### `GET /api/projects/:id`
Gets a single project by ID.

**Query Parameters:**
- `details=true` - Include tasks, quick links, and stats

### `PUT /api/projects/:id`
Updates a project.

### `DELETE /api/projects/:id`
Deletes a project.

**Query Parameters:**
- `force=true` - Delete even if project has tasks

## Tasks API

### `GET /api/tasks`
Lists tasks with filtering options.

**Query Parameters:**
- `project=id` - Filter by project ID
- `status=todo|in_progress|done|archived` - Filter by status
- `priority=low|medium|high` - Filter by priority
- `search=text` - Search in title and description
- `details=true` - Include project and time session data
- `limit=50` - Number of results (default: 50)
- `offset=0` - Pagination offset

### `POST /api/tasks`
Creates a new task.

**Body:**
```typescript
{
  title: string;              // Required, 1-500 chars
  description?: string;       
  projectId: number;          // Required
  estimatedMinutes: number;   // Required, 1-1440 (24h max)
  estimatedIntensity: 1|2|3|4|5; // Required intensity level
  priority?: 'low'|'medium'|'high';
  dueDate?: string;           // ISO date string
  status?: 'todo'|'in_progress'|'done'|'archived';
  boardColumn?: string;
  position?: number;
}
```

### `GET /api/tasks/:id`
Gets a single task by ID.

**Query Parameters:**
- `details=true` - Include project and time sessions

### `PUT /api/tasks/:id`
Updates a task.

### `DELETE /api/tasks/:id`
Deletes a task.

### `POST /api/tasks/:id/complete`
Completes a task with actual intensity rating.

**Body:**
```typescript
{
  actualIntensity: 1|2|3|4|5;  // Required
  actualMinutes?: number;      // Optional if using timer
}
```

**Response:**
```typescript
{
  task: Task;
  estimationAccuracy: {
    timeAccuracy: number;      // % difference from estimate
    intensityMatch: boolean;   // exact match
    estimatedMinutes: number;
    actualMinutes: number;
    estimatedIntensity: number;
    actualIntensity: number;
  }
}
```

## Time Sessions API

### `GET /api/time-sessions`
Lists time tracking sessions.

**Query Parameters:**
- `task=id` - Filter by task ID
- `project=id` - Filter by project ID
- `active=true` - Only active sessions
- `startDate=date` - Filter by start date
- `endDate=date` - Filter by end date
- `details=true` - Include task and project data
- `limit=50` - Number of results

### `POST /api/time-sessions`
Creates a new time session.

**Body:**
```typescript
{
  taskId?: number;        // Either taskId or projectId required
  projectId?: number;     
  description?: string;
  startTime: string;      // ISO date string
  endTime?: string;       // For completed sessions
  duration?: number;      // In seconds
  isActive?: boolean;     // Default: false
}
```

### `GET /api/time-sessions/:id`
Gets a single session by ID.

### `PUT /api/time-sessions/:id`
Updates a time session.

### `DELETE /api/time-sessions/:id`
Deletes a time session.

### `POST /api/time-sessions/start`
Starts a timer for a task.

**Body:**
```typescript
{
  taskId: number;  // Required
}
```

- Stops any existing active sessions for the task
- Sets task status to 'in_progress' if it was 'todo'
- Creates new active session

### `POST /api/time-sessions/stop`
Stops an active timer.

**Body:**
```typescript
{
  sessionId?: number;  // Either sessionId or taskId required
  taskId?: number;
}
```

### `GET /api/time-sessions/active`
Gets the current active session if any.

**Response:**
```typescript
{
  activeSession: TimeSessionWithDetails | null;
  elapsedSeconds?: number;  // Current elapsed time
}
```

## Quick Links API

### `GET /api/quick-links`
Lists quick links.

**Query Parameters:**
- `project=id` - Filter by project ID
- `category=docs|tools|resources|other` - Filter by category

### `POST /api/quick-links`
Creates a new quick link.

**Body:**
```typescript
{
  title: string;                            // Required, 1-255 chars
  url: string;                             // Required, valid URL
  projectId: number;                       // Required
  icon?: string;                           // Emoji or icon class
  category?: 'docs'|'tools'|'resources'|'other';
  position?: number;                       // Auto-assigned if not provided
}
```

### `GET /api/quick-links/:id`
Gets a single quick link by ID.

### `PUT /api/quick-links/:id`
Updates a quick link.

### `DELETE /api/quick-links/:id`
Deletes a quick link.

## Error Handling

All endpoints return errors in this format:
```typescript
{
  error: string;
  details?: Record<string, unknown>;
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (e.g., deleting project with tasks)
- `500` - Internal Server Error

## Key Features

### Time & Intensity Tracking
- **Before starting**: Tasks require estimated time and intensity (1-5)
- **During work**: Toggl-like timer with start/stop functionality
- **After completion**: Rate actual intensity and compare with estimates
- **Multiple sessions**: Track interrupted work sessions per task

### Smart Timer Features
- Auto-stops existing timers when starting new ones
- Calculates actual time from timer sessions
- Updates task status automatically
- Tracks estimation accuracy over time

### Project Organization
- Color-coded projects with icons
- Quick links per project with categories
- Task filtering by project
- Project statistics (time spent, completion rates)

## Usage Examples

### Start a timer for a task
```typescript
const response = await fetch('/api/time-sessions/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ taskId: 123 })
});
```

### Complete a task with intensity rating
```typescript
const response = await fetch('/api/tasks/123/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ actualIntensity: 4 })
});
```

### Get current active session
```typescript
const { activeSession, elapsedSeconds } = await fetch('/api/time-sessions/active')
  .then(r => r.json());
```

### Create a task with time estimation
```typescript
const task = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Implement feature X',
    projectId: 1,
    estimatedMinutes: 120,
    estimatedIntensity: 3,
    priority: 'high'
  })
});
```