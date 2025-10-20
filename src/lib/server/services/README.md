# Service Layer

## Overview

The service layer contains **business logic** for the application. Services orchestrate repositories, validators, and business rules to provide high-level operations that API routes can use.

Services follow the **Single Responsibility Principle** - each service manages business logic for one entity type only.

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP) ⭐
Each service has **one reason to change**:
- `TaskService` - Task business logic only
- `ProjectService` - Project business logic only
- `QuickLinkService` - QuickLink business logic only

Services do NOT handle:
- HTTP concerns (request/response) - that's for API routes
- Data persistence - that's for repositories
- Input validation rules - that's for validators

### 2. Dependency Inversion Principle (DIP) ⭐
- Services depend on **repository abstractions** (`ITaskRepository`, etc.)
- Not coupled to concrete implementations
- Easy to swap data sources (Drizzle → Prisma → Mock)
- Services can be tested with mock repositories

### 3. Open/Closed Principle (OCP)
- New business operations can be added without modifying existing methods
- Validators are composable and extensible
- Repository implementations can be changed without touching services

### 4. Liskov Substitution Principle (LSP)
- All service instances can be swapped with test doubles
- Mock services behave identically to real services
- Factory pattern enables polymorphic service creation

### 5. Interface Segregation Principle (ISP)
- Services expose only relevant business methods
- No god objects with hundreds of methods
- Each method has a clear, focused purpose

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  API Routes                     │
│           (HTTP Layer - routes/api/)            │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Uses services for business logic
                  ▼
┌─────────────────────────────────────────────────┐
│              Service Layer ⭐                    │
│         (Business Logic - lib/server/services/) │
│  - Orchestrates repositories and validators    │
│  - Enforces business rules                     │
│  - Coordinates multi-step operations           │
└─────────────┬───────────────┬───────────────────┘
              │               │
     Uses repositories    Uses validators
              │               │
              ▼               ▼
┌─────────────────────┐  ┌──────────────────┐
│   Repository Layer  │  │  Validation      │
│   (Data Access)     │  │  (Input Rules)   │
└─────────────────────┘  └──────────────────┘
```

## Directory Structure

```
services/
├── README.md                 # This file
├── index.ts                  # Central export point
├── task.service.ts           # Task business logic
├── project.service.ts        # Project business logic
└── quicklink.service.ts      # QuickLink business logic
```

## Service Responsibilities

### TaskService
**Purpose**: Task lifecycle and estimation tracking

**Key Operations**:
- Create tasks with estimate validation
- Update tasks with status transition rules
- Complete tasks with accuracy calculation
- Get tasks by project, status, or user
- Batch operations
- Statistics and analytics

**Business Rules**:
- Estimate reasonableness checks
- Status transition validation
- Due date warnings
- Estimation accuracy tracking

### ProjectService
**Purpose**: Hierarchical project management

**Key Operations**:
- Create projects with depth validation
- Update projects with archive rules
- Move projects (prevent circular references)
- Get project tree and breadcrumbs
- Project statistics
- Batch operations

**Business Rules**:
- Maximum hierarchy depth (default: 10 levels)
- Circular reference prevention
- Archive validation (no active sub-projects/tasks)
- Unique names within parent

### QuickLinkService
**Purpose**: Quick link management and organization

**Key Operations**:
- Create/update/delete quick links
- Group by category
- Reorder within categories
- Copy links between projects
- Search and filter
- Batch operations

**Business Rules**:
- URL validation
- Category management
- Display order maintenance

## Usage Examples

### Basic Usage

```typescript
import { taskService } from '$lib/server/services';

// Create a task
const task = await taskService.createTask({
  title: 'Implement feature X',
  projectId: 1,
  estimatedMinutes: 120,
  estimatedIntensity: 3,
  status: 'todo',
  priority: 'high'
});

// Complete a task with actual values
const result = await taskService.completeTask(task.id, 4, 150);
console.log('Estimation accuracy:', result.estimationAccuracy);
// { timeAccuracy: 75, intensityAccuracy: 75 }
```

### In API Routes

**Before (Direct DB Access - Bad):**
```typescript
// routes/api/tasks/+server.ts
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  // Validation scattered in route
  if (!data.title || data.title.length > 500) {
    return json({ error: 'Invalid title' }, { status: 400 });
  }

  // Direct database access
  const [task] = await db.insert(tasks).values(data).returning();

  return json(task);
};
```

**After (Service Layer - Good):**
```typescript
// routes/api/tasks/+server.ts
import { taskService } from '$lib/server/services';
import { ValidationException } from '$lib/server/validation';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  try {
    const task = await taskService.createTask(data);
    return json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }
    throw error;
  }
};
```

### Project Hierarchy Operations

```typescript
import { projectService } from '$lib/server/services';

// Get full project tree
const tree = await projectService.getProjectTree(true);
// Returns: { roots: [...], stats: {...} }

// Move a project
try {
  await projectService.moveProject(5, 2);
} catch (error) {
  // Error: "Cannot move project to its own descendant"
}

// Get breadcrumb navigation
const breadcrumb = await projectService.getProjectBreadcrumb(5);
// Returns: [root, parent, current]

// Archive project with validation
try {
  await projectService.archiveProject(3);
} catch (error) {
  // Error: "Cannot archive project with active tasks"
}
```

### Batch Operations

```typescript
import { taskService, quickLinkService } from '$lib/server/services';

// Batch update tasks
const updates = [
  { id: 1, data: { priority: 'high' } },
  { id: 2, data: { status: 'in_progress' } },
  { id: 3, data: { estimatedMinutes: 60 } }
];

const updatedTasks = await taskService.batchUpdateTasks(updates);

// Copy quick links between projects
const copiedLinks = await quickLinkService.copyQuickLinksToProject(
  1, // source project
  2, // target project
  ['docs', 'tools'] // only these categories
);
```

### Statistics and Analytics

```typescript
import { taskService, projectService } from '$lib/server/services';

// Task completion statistics
const stats = await taskService.getCompletionStats(
  1, // projectId
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
console.log(stats);
// {
//   total: 50,
//   completed: 35,
//   inProgress: 10,
//   todo: 5,
//   completionRate: 70,
//   avgEstimatedMinutes: 120,
//   avgActualMinutes: 140,
//   avgEstimationAccuracy: 85
// }

// Multi-project statistics
const multiStats = await projectService.getMultiProjectStats([1, 2, 3]);
console.log(multiStats);
// {
//   totalProjects: 3,
//   totalTasks: 150,
//   totalCompleted: 100,
//   totalInProgress: 30,
//   totalTodo: 20,
//   totalTimeSpent: 18000, // minutes
//   averageCompletion: 66.7
// }
```

## Testing Services

### Unit Testing with Mock Repositories

```typescript
import { TaskService } from '$lib/server/services';
import { describe, it, expect, vi } from 'vitest';

describe('TaskService', () => {
  it('should create task with validation', async () => {
    // Mock repository
    const mockRepo = {
      create: vi.fn().mockResolvedValue({
        id: 1,
        title: 'Test',
        estimatedMinutes: 60,
        estimatedIntensity: 3
      }),
      findById: vi.fn(),
      update: vi.fn(),
      // ... other methods
    };

    const service = new TaskService(mockRepo);

    const task = await service.createTask({
      title: 'Test',
      projectId: 1,
      estimatedMinutes: 60,
      estimatedIntensity: 3,
      status: 'todo',
      priority: 'medium'
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      title: 'Test',
      projectId: 1,
      estimatedMinutes: 60,
      estimatedIntensity: 3,
      status: 'todo',
      priority: 'medium'
    });
    expect(task.id).toBe(1);
  });

  it('should validate task completion', async () => {
    const mockRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 1,
        estimatedMinutes: 120,
        estimatedIntensity: 3
      }),
      complete: vi.fn().mockResolvedValue({
        id: 1,
        estimatedMinutes: 120,
        estimatedIntensity: 3,
        actualMinutes: 150,
        actualIntensity: 4,
        status: 'done'
      })
    };

    const service = new TaskService(mockRepo);

    const result = await service.completeTask(1, 4, 150);

    expect(result.task.status).toBe('done');
    expect(result.estimationAccuracy.timeAccuracy).toBeCloseTo(75);
    expect(result.estimationAccuracy.intensityAccuracy).toBeCloseTo(75);
  });
});
```

### Integration Testing

```typescript
import { taskService } from '$lib/server/services';
import { db } from '$lib/server/db';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('TaskService Integration', () => {
  let testProjectId: number;

  beforeAll(async () => {
    // Setup test data
    const [project] = await db.insert(projects).values({
      name: 'Test Project'
    }).returning();
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(projects).where(eq(projects.id, testProjectId));
  });

  it('should create and complete task end-to-end', async () => {
    // Create task
    const task = await taskService.createTask({
      title: 'Integration test',
      projectId: testProjectId,
      estimatedMinutes: 60,
      estimatedIntensity: 3,
      status: 'todo',
      priority: 'medium'
    });

    expect(task.id).toBeDefined();
    expect(task.status).toBe('todo');

    // Complete task
    const result = await taskService.completeTask(task.id, 3, 55);

    expect(result.task.status).toBe('done');
    expect(result.task.actualMinutes).toBe(55);
    expect(result.estimationAccuracy.timeAccuracy).toBeGreaterThan(90);
  });
});
```

## Best Practices

### 1. Always Use Services in API Routes

```typescript
// ✅ Good - Use service layer
import { taskService } from '$lib/server/services';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const task = await taskService.createTask(data);
  return json(task);
};

// ❌ Bad - Direct repository access from route
import { taskRepository } from '$lib/server/repositories';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const task = await taskRepository.create(data);
  return json(task);
};
```

### 2. Let Services Handle Business Logic

```typescript
// ✅ Good - Business logic in service
class TaskService {
  async completeTask(id: number, actualIntensity: number, actualMinutes?: number) {
    // Validation
    completeTaskValidator.validateOrThrow({ actualIntensity, actualMinutes });

    // Business logic
    const task = await this.taskRepository.complete(id, actualIntensity, actualMinutes);

    // Calculate derived data
    const estimationAccuracy = this.calculateEstimationAccuracy(task);

    return { task, estimationAccuracy };
  }
}

// ❌ Bad - Business logic in route
export const POST: RequestHandler = async ({ request }) => {
  const { id, actualIntensity, actualMinutes } = await request.json();

  const task = await taskRepository.complete(id, actualIntensity, actualMinutes);

  // Calculating business data in route!
  const timeAccuracy = Math.max(0,
    (1 - Math.abs(task.actualMinutes - task.estimatedMinutes) / task.estimatedMinutes) * 100
  );

  return json({ task, timeAccuracy });
};
```

### 3. Use Dependency Injection for Testing

```typescript
// ✅ Good - Constructor injection
class TaskService {
  constructor(private taskRepository: ITaskRepository) {}
}

// Easy to test
const mockRepo = createMockTaskRepository();
const service = new TaskService(mockRepo);

// ❌ Bad - Direct import
class TaskService {
  private taskRepository = taskRepository; // Hard-coded dependency
}
```

### 4. Handle Errors Appropriately

```typescript
// ✅ Good - Throw descriptive errors
async deleteProject(id: number): Promise<boolean> {
  const children = await this.projectRepository.findChildren(id);
  if (children.length > 0) {
    throw new Error('Cannot delete project with sub-projects. Delete or move them first.');
  }
  return this.projectRepository.delete(id);
}

// ❌ Bad - Silent failures
async deleteProject(id: number): Promise<boolean> {
  const children = await this.projectRepository.findChildren(id);
  if (children.length > 0) {
    return false; // What went wrong? User doesn't know!
  }
  return this.projectRepository.delete(id);
}
```

### 5. Use ValidationException for User Errors

```typescript
// ✅ Good - Structured validation errors
import { ValidationException } from '$lib/server/validation';

async moveProject(projectId: number, newParentId: number | null): Promise<Project> {
  const moveCheck = ProjectBusinessRules.validateMoveDestination(
    projectId,
    newParentId,
    () => ancestorIds
  );

  if (!moveCheck.valid) {
    throw new ValidationException(moveCheck.errors);
  }

  return this.projectRepository.move(projectId, newParentId);
}

// ❌ Bad - Generic errors
async moveProject(projectId: number, newParentId: number | null): Promise<Project> {
  if (projectId === newParentId) {
    throw new Error('Invalid move'); // Not structured!
  }
  return this.projectRepository.move(projectId, newParentId);
}
```

## Common Patterns

### 1. Multi-Step Operations

```typescript
async completeTask(id: number, actualIntensity: number, actualMinutes?: number) {
  // Step 1: Validate input
  completeTaskValidator.validateOrThrow({ actualIntensity, actualMinutes });

  // Step 2: Get existing data
  const existing = await this.taskRepository.findById(id);
  if (!existing) {
    throw new Error(`Task with ID ${id} not found`);
  }

  // Step 3: Apply business rules
  if (existing.dueDate) {
    const dueDateCheck = TaskBusinessRules.validateDueDate(existing.dueDate);
    if (!dueDateCheck.valid) {
      console.warn('Task overdue:', dueDateCheck.errors);
    }
  }

  // Step 4: Perform operation
  const task = await this.taskRepository.complete(id, actualIntensity, actualMinutes);

  // Step 5: Calculate derived data
  const estimationAccuracy = this.calculateEstimationAccuracy(task);

  return { task, estimationAccuracy };
}
```

### 2. Aggregation Operations

```typescript
async getMultiProjectStats(projectIds: number[]) {
  // Fetch all stats in parallel
  const stats = await Promise.all(
    projectIds.map(id => this.projectRepository.getStatsByProject(id))
  );

  // Aggregate results
  return {
    totalProjects: projectIds.length,
    totalTasks: stats.reduce((sum, s) => sum + s.totalTasks, 0),
    totalCompleted: stats.reduce((sum, s) => sum + s.completedTasks, 0),
    averageCompletion: stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length
  };
}
```

### 3. Batch Operations with Error Handling

```typescript
async batchUpdateTasks(updates: Array<{ id: number; data: UpdateTaskDTO }>): Promise<Task[]> {
  const updatedTasks: Task[] = [];

  for (const { id, data } of updates) {
    try {
      const updated = await this.updateTask(id, data);
      updatedTasks.push(updated);
    } catch (error) {
      console.error(`Failed to update task ${id}:`, error);
      // Continue with other updates
    }
  }

  return updatedTasks;
}
```

## Migration Guide

### From Direct Repository Access to Services

**Before:**
```typescript
// routes/api/tasks/[id]/complete/+server.ts
import { taskRepository } from '$lib/server/repositories';

export const POST: RequestHandler = async ({ params, request }) => {
  const { actualIntensity, actualMinutes } = await request.json();

  const task = await taskRepository.complete(
    parseInt(params.id),
    actualIntensity,
    actualMinutes
  );

  return json(task);
};
```

**After:**
```typescript
// routes/api/tasks/[id]/complete/+server.ts
import { taskService } from '$lib/server/services';
import { ValidationException } from '$lib/server/validation';

export const POST: RequestHandler = async ({ params, request }) => {
  const { actualIntensity, actualMinutes } = await request.json();

  try {
    const result = await taskService.completeTask(
      parseInt(params.id),
      actualIntensity,
      actualMinutes
    );

    return json(result);
  } catch (error) {
    if (error instanceof ValidationException) {
      return json(error.toJSON(), { status: 400 });
    }
    throw error;
  }
};
```

## When to Create New Services

Create a new service when:

1. **New Entity Type**: Adding user management? Create `UserService`
2. **Complex Domain Logic**: Time session tracking? Create `TimeSessionService`
3. **Cross-Entity Operations**: Analytics across multiple entities? Create `AnalyticsService`

Each service should:
- Manage one domain concept
- Have 10-30 methods (if more, consider splitting)
- Depend only on repository interfaces
- Be independently testable

## Related Documentation

- [Repository Layer README](../repositories/README.md)
- [Validation Framework README](../validation/README.md)
- [API Routes Guide](../../../routes/api/README.md)
