# Types Documentation

This directory contains all TypeScript type definitions for the productivity dashboard.

## Files Overview

### `database.ts`
Complete type definitions for database entities and API interactions.

**Core Types:**
- `Project`, `NewProject` - Project management types
- `Task`, `NewTask` - Task entities with time/intensity tracking
- `TimeSession`, `NewTimeSession` - Time tracking session types
- `QuickLink`, `NewQuickLink` - Project quick links
- `Tag`, `NewTag` - Task categorization tags

**Extended Types:**
- `TaskWithDetails` - Task with relations (project, time sessions, tags)
- `ProjectWithDetails` - Project with stats and relations
- `TimeSessionWithDetails` - Session with task and project data

**Utility Types:**
- `IntensityLevel` - 1-5 scale for task difficulty
- `TaskStatus` - todo, in_progress, done, archived
- `Priority` - low, medium, high
- `LinkCategory` - docs, tools, resources, other

**API Types:**
- Request/Response types for all endpoints
- Form data types for UI components
- Validation error types
- Filter types for queries

**Analytics Types:**
- `TaskEstimationAccuracy` - Comparison of estimated vs actual
- `ProjectStats` - Aggregated project metrics
- `DailySummary`, `WeeklySummary` - Time reporting types

**Timer Types:**
- `TimerState` - Current timer status and elapsed time
- Timer control request/response types

## Key Features

### Time & Intensity Tracking
All task types include:
- `estimatedMinutes` and `estimatedIntensity` (required)
- `actualMinutes` and `actualIntensity` (set on completion)
- Accuracy calculation helpers

### Type Safety
- Strict validation constraints
- Enum types for status values
- Required vs optional fields clearly marked
- Inferred types from Drizzle schema

### API Integration
- Request/response types match API endpoints exactly
- Error handling types for consistent error responses
- Filter types for search and pagination

## Usage Examples

### Creating a new task
```typescript
import type { TaskFormData } from '$lib/types/database';

const taskData: TaskFormData = {
  title: 'Implement feature',
  projectId: 1,
  estimatedMinutes: 120,
  estimatedIntensity: 3,
  priority: 'high'
};
```

### Working with task completion
```typescript
import type { CompleteTaskRequest, TaskEstimationAccuracy } from '$lib/types/database';

const completion: CompleteTaskRequest = {
  id: 123,
  actualIntensity: 4
};

// Response includes accuracy metrics
const { task, estimationAccuracy }: { 
  task: Task, 
  estimationAccuracy: TaskEstimationAccuracy 
} = await response.json();
```

### Timer state management
```typescript
import type { TimerState } from '$lib/types/database';

const timerState: TimerState = {
  isRunning: true,
  currentTaskId: 123,
  currentSessionId: 456,
  startTime: new Date(),
  elapsedSeconds: 1800
};
```

### Project with stats
```typescript
import type { ProjectWithDetails } from '$lib/types/database';

const project: ProjectWithDetails = {
  id: 1,
  name: 'My Project',
  color: '--nord8',
  totalTasks: 25,
  completedTasks: 18,
  totalMinutes: 1440
};
```

## Type Inference

Types are automatically inferred from the Drizzle schema:

```typescript
// Base types inferred from schema
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

// Extended with manual additions
export interface ProjectWithDetails extends Project {
  tasks?: Task[];
  quickLinks?: QuickLink[];
  totalTasks?: number;
  completedTasks?: number;
  totalMinutes?: number;
}
```

This ensures type safety between database schema and application logic.