# Repository Layer

## Overview

The repository layer implements the **Repository Pattern** to provide a clean abstraction over data access operations. This layer is crucial for maintaining SOLID principles in the application architecture.

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
Each repository handles **only one entity type** and its related operations:
- `ITaskRepository` - Task data access only
- `IProjectRepository` - Project data access only
- `IQuickLinkRepository` - QuickLink data access only

### 2. Open/Closed Principle (OCP)
- New repositories can be added without modifying existing code
- New query methods can be added to interfaces without breaking implementations
- Filter objects allow extension without modification

### 3. Liskov Substitution Principle (LSP)
- All implementations can be substituted for their interfaces
- Drizzle implementations can be swapped for other ORMs (e.g., Prisma, TypeORM)
- Mock implementations can replace real ones in tests

### 4. Interface Segregation Principle (ISP)
- Base repository provides core CRUD operations
- Specific repositories extend with entity-specific methods
- Consumers only depend on methods they actually use

### 5. Dependency Inversion Principle (DIP)
- High-level services depend on `IRepository` interfaces
- Low-level Drizzle implementations depend on the same interfaces
- Database details are abstracted away from business logic

## Directory Structure

```
repositories/
├── README.md                          # This file
├── index.ts                           # Main export point
├── interfaces/                        # Abstract contracts
│   ├── base.repository.ts             # Generic CRUD interface
│   ├── task.repository.ts             # Task-specific interface
│   ├── project.repository.ts          # Project-specific interface
│   ├── quicklink.repository.ts        # QuickLink-specific interface
│   └── index.ts
└── implementations/                   # Concrete implementations
    ├── drizzle-task.repository.ts     # Drizzle-based task repo
    ├── drizzle-project.repository.ts  # Drizzle-based project repo
    ├── drizzle-quicklink.repository.ts # Drizzle-based quicklink repo
    └── index.ts
```

## Usage Examples

### Basic CRUD Operations

```typescript
import { taskRepository } from '$lib/server/repositories';

// Create
const newTask = await taskRepository.create({
  title: 'Complete repository documentation',
  projectId: 1,
  status: 'todo',
  priority: 'high',
  estimatedMinutes: 60,
  estimatedIntensity: 3
});

// Read
const task = await taskRepository.findById(1);
const allTasks = await taskRepository.findAll();

// Update
const updated = await taskRepository.update(1, {
  status: 'in_progress'
});

// Delete
const deleted = await taskRepository.delete(1);
```

### Advanced Queries with Filters

```typescript
import { taskRepository } from '$lib/server/repositories';

// Find tasks with filters
const tasks = await taskRepository.findAll({
  projectId: 1,
  status: 'todo',
  priority: 'high',
  search: 'documentation',
  dueAfter: new Date('2025-01-01'),
  dueBefore: new Date('2025-12-31')
});

// Find by status
const inProgressTasks = await taskRepository.findByStatus('in_progress', projectId);

// Paginated results
const { items, total, totalPages } = await taskRepository.findByProject(
  projectId,
  { limit: 20, offset: 0 }
);
```

### Hierarchical Project Operations

```typescript
import { projectRepository } from '$lib/server/repositories';

// Get project tree structure
const { roots, flatMap } = await projectRepository.getTree(true);

// Find all children
const children = await projectRepository.findChildren(parentId);

// Find all descendants recursively
const descendants = await projectRepository.findDescendants(projectId);

// Move project in hierarchy
await projectRepository.move(projectId, newParentId);

// Get aggregated statistics
const stats = await projectRepository.getStats(projectId, true);
console.log(`Total tasks (including subprojects): ${stats.totalTasks}`);
console.log(`Direct tasks only: ${stats.directTasks}`);
```

### Using with Services (Recommended)

```typescript
// services/task.service.ts
import type { ITaskRepository } from '$lib/server/repositories/interfaces';

export class TaskService {
  constructor(private taskRepo: ITaskRepository) {}

  async createTask(data: NewTask) {
    // Validation logic here
    return this.taskRepo.create(data);
  }

  async completeTask(taskId: number, actualIntensity: number) {
    // Business logic here
    return this.taskRepo.complete(taskId, actualIntensity);
  }
}

// In API route
import { taskRepository } from '$lib/server/repositories';
const taskService = new TaskService(taskRepository);
```

## Testing with Mock Repositories

```typescript
// __tests__/mocks/mock-task.repository.ts
import type { ITaskRepository } from '$lib/server/repositories/interfaces';

export class MockTaskRepository implements ITaskRepository {
  private tasks: Task[] = [];

  async findAll(): Promise<Task[]> {
    return this.tasks;
  }

  async create(data: NewTask): Promise<Task> {
    const task = { ...data, id: this.tasks.length + 1 };
    this.tasks.push(task);
    return task;
  }

  // Implement other methods...
}

// In test
const mockRepo = new MockTaskRepository();
const service = new TaskService(mockRepo);
```

## Benefits

### 1. **Testability**
- Easy to mock for unit tests
- No database required for testing business logic
- Consistent interface across real and mock implementations

### 2. **Maintainability**
- Database logic isolated from business logic
- Easy to refactor database queries
- Clear separation of concerns

### 3. **Flexibility**
- Can swap ORMs without changing services
- Easy to add caching layer
- Simple to implement read replicas

### 4. **Type Safety**
- Full TypeScript support
- Compile-time error checking
- IDE autocomplete

## Migration Guide

### From Direct Database Access to Repository

**Before (Violates DIP):**
```typescript
// In API route
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';

export const GET = async ({ url }) => {
  const projectId = url.searchParams.get('project');
  const results = await db.select()
    .from(tasks)
    .where(eq(tasks.projectId, parseInt(projectId)));
  return json(results);
}
```

**After (Follows DIP):**
```typescript
// In API route
import { taskRepository } from '$lib/server/repositories';

export const GET = async ({ url }) => {
  const projectId = url.searchParams.get('project');
  const results = await taskRepository.findAll({
    projectId: parseInt(projectId)
  });
  return json(results);
}
```

Even better with service layer:
```typescript
import { taskService } from '$lib/server/services';

export const GET = async ({ url }) => {
  const projectId = url.searchParams.get('project');
  const results = await taskService.getTasksByProject(parseInt(projectId));
  return json(results);
}
```

## Best Practices

1. **Always use interfaces in services**
   ```typescript
   // Good
   constructor(private taskRepo: ITaskRepository) {}

   // Bad
   constructor(private taskRepo: DrizzleTaskRepository) {}
   ```

2. **Use filters instead of raw queries**
   ```typescript
   // Good
   taskRepository.findAll({ status: 'todo', projectId: 1 });

   // Bad
   db.select().from(tasks).where(and(eq(tasks.status, 'todo'), eq(tasks.projectId, 1)));
   ```

3. **Keep repositories focused**
   - Don't add business logic to repositories
   - Only data access and transformation
   - Complex operations belong in services

4. **Use batch operations when possible**
   ```typescript
   // Good
   const stats = await projectRepository.getBatchStats([1, 2, 3, 4]);

   // Bad
   for (const id of [1, 2, 3, 4]) {
     const stats = await projectRepository.getStats(id);
   }
   ```

## Future Enhancements

- [ ] Add caching layer
- [ ] Implement soft deletes
- [ ] Add audit logging
- [ ] Create read/write repository separation
- [ ] Add database transaction support
- [ ] Implement repository decorators (caching, logging)

## Related Documentation

- [Service Layer README](../services/README.md)
- [Validation Framework README](../validation/README.md)
- [API Routes Guide](../../../routes/api/README.md)
