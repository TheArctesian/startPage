# Stores Documentation

This directory contains all Svelte stores for state management, following UNIX philosophy: each module has a single, well-defined responsibility.

## Files Overview

### `index.ts` - Core State Management
Central store definitions and derived state calculations.

**Core Data Stores:**
- `projects` - All available projects
- `tasks` - Task list with filtering capabilities  
- `timeSessions` - Time tracking sessions
- `quickLinks` - Project-specific quick access links

**Selection State:**
- `activeProject` - Currently selected project
- `selectedTask` - Currently focused task

**Timer State:**
- `timerState` - Active timer status and elapsed time

**UI State:**
- `isLoading` - Global loading indicator
- `error` - Error message display

**Derived Stores (Computed Values):**
- `activeProjectTasks` - Tasks filtered by active project
- `activeProjectQuickLinks` - Links filtered by active project
- `todoTasks`, `inProgressTasks`, `doneTasks` - Tasks by status
- `currentTimer` - Timer state with current task info
- `timerDisplay` - Formatted time display (MM:SS or H:MM:SS)
- `projectStats` - Aggregated project statistics

### `actions.ts` - State Mutations
All state-changing operations, each function does one thing well.

**Project Actions:**
- `loadProjects()` - Fetch all projects from API
- `createProject()` - Create new project and update store
- `updateProject()` - Update existing project
- `setActiveProject()` - Change active project and load related data

**Task Actions:**
- `loadTasks()` - Fetch tasks, optionally filtered by project
- `createTask()` - Create new task with validation
- `updateTask()` - Update existing task
- `completeTask()` - Mark task as done with actual intensity rating

**Timer Actions:**
- `startTimer()` - Start timer for specific task
- `stopTimer()` - Stop active timer
- `loadActiveTimer()` - Restore active timer on page load
- `updateTimerElapsed()` - Update elapsed seconds (called by interval)

**Quick Links Actions:**
- `loadQuickLinks()` - Fetch links for specific project
- `createQuickLink()` - Add new quick access link

**Utility Actions:**
- `setSelectedTask()` - Select task for UI focus
- `clearError()` - Clear error state

### `persistence.ts` - Local Storage Management
Handles browser storage with automatic save/restore functionality.

**Storage Functions:**
- `saveActiveProject()` - Persist selected project
- `loadActiveProject()` - Restore selected project on reload
- `saveTimerState()` - Persist timer during active sessions
- `loadTimerState()` - Restore timer after page refresh
- `savePreferences()` - Save user settings
- `loadPreferences()` - Load user settings

**Initialization:**
- `initializePersistence()` - Set up auto-save subscriptions
- `restorePersistedState()` - Restore state on app start
- `clearPersistedData()` - Clear all stored data

**User Preferences:**
```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  defaultEstimatedMinutes: number;
  autoStartTimer: boolean;
  showEstimationAccuracy: boolean;
}
```

## Architecture Principles

### UNIX Philosophy Implementation

1. **Single Responsibility**: Each store file has one purpose
   - `index.ts` - State definitions only
   - `actions.ts` - State mutations only  
   - `persistence.ts` - Storage operations only

2. **Composability**: Small, focused functions that combine well
   - `loadProjects()` then `setActiveProject()`
   - `createTask()` then optionally `startTimer()`

3. **Data Flow**: Unidirectional data flow
   - Actions → API calls → Store updates → UI reactivity

### Error Handling Strategy

- Centralized error state in stores
- Each action handles its own errors
- User-friendly error messages
- Automatic error clearing on successful operations

### Performance Optimizations

- Derived stores for computed values (no redundant calculations)
- Selective loading (only active project data)
- Local storage persistence to reduce API calls
- Debounced timer updates

## Usage Examples

### Basic Store Usage
```typescript
import { activeProject, tasks, createTask } from '$lib/stores';

// Subscribe to reactive values
$: currentProject = $activeProject;
$: projectTasks = $tasks.filter(t => t.projectId === currentProject?.id);

// Call actions
async function addNewTask() {
  await createTask({
    title: 'New task',
    projectId: $activeProject.id,
    estimatedMinutes: 60,
    estimatedIntensity: 3
  });
}
```

### Timer Management
```typescript
import { startTimer, stopTimer, timerDisplay, isTimerRunning } from '$lib/stores';

// Display timer
$: timeDisplay = $timerDisplay; // "25:30" or "1:25:30"
$: isActive = $isTimerRunning;

// Control timer
async function toggleTimer(taskId: number) {
  if ($isTimerRunning) {
    await stopTimer();
  } else {
    await startTimer(taskId);
  }
}
```

### Project Statistics
```typescript
import { projectStats } from '$lib/stores';

// Reactive project data with stats
$: stats = $projectStats;
// Each project includes: totalTasks, completedTasks, totalMinutes, completionRate
```

### Error Handling
```typescript
import { error, clearError } from '$lib/stores';

// Display errors
$: errorMessage = $error;

// Clear errors
function dismissError() {
  clearError();
}
```

## Data Flow Diagram

```
User Action → Store Action → API Call → Store Update → UI Update
     ↓              ↓           ↓           ↓           ↓
  Click Start → startTimer() → POST /api/time-sessions/start → timerState.set() → Timer UI
     ↓              ↓           ↓           ↓           ↓
  Click Stop  → stopTimer()  → POST /api/time-sessions/stop  → timerState.set() → Timer UI
```

## Initialization Sequence

1. `restorePersistedState()` - Load saved data from localStorage
2. `initializePersistence()` - Set up auto-save subscriptions  
3. `loadProjects()` - Fetch projects from API
4. `loadActiveTimer()` - Check for active timer session
5. UI components subscribe to stores and react to changes

## Best Practices

1. **Always use actions for mutations** - Never directly call `.set()` on stores from components
2. **Handle loading states** - Use `isLoading` store for user feedback
3. **Clear errors appropriately** - Call `clearError()` before new operations
4. **Persist important state** - Timer and active project survive page refreshes
5. **Use derived stores** - For computed values that multiple components need
6. **Keep actions focused** - Each function should do one thing well
7. **Handle offline scenarios** - Graceful degradation when API calls fail