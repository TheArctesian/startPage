import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  projects,
  tasks,
  quickLinks,
  tags,
  taskTags,
  users,
  authSessions,
  userActivities,
  projectUsers
} from '$lib/server/db/schema';

// Base Types from Schema
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;

export type QuickLink = InferSelectModel<typeof quickLinks>;
export type NewQuickLink = InferInsertModel<typeof quickLinks>;

export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;

export type TaskTag = InferSelectModel<typeof taskTags>;
export type NewTaskTag = InferInsertModel<typeof taskTags>;

// Auth-related types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type AuthSession = InferSelectModel<typeof authSessions>;
export type NewAuthSession = InferInsertModel<typeof authSessions>;

export type UserActivity = InferSelectModel<typeof userActivities>;
export type NewUserActivity = InferInsertModel<typeof userActivities>;

export type ProjectUser = InferSelectModel<typeof projectUsers>;
export type NewProjectUser = InferInsertModel<typeof projectUsers>;

// Enum Types
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type ProjectStatus = 'active' | 'done' | 'archived';
export type Priority = 'low' | 'medium' | 'high';
export type LinkCategory = 'docs' | 'tools' | 'resources' | 'other';
export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

// Auth-related enums
export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved' | 'suspended';
export type PermissionLevel = 'view_only' | 'editor' | 'project_admin';

// Extended Types with Relations
export interface TaskWithDetails extends Task {
  project?: Project;
  tags?: Tag[];
}

export interface ProjectWithDetails extends Project {
  tasks?: Task[];
  quickLinks?: QuickLink[];
  createdByUser?: User;
  userAccess?: ProjectUserWithDetails[];

  // Computed stats (aggregated - includes subprojects)
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  totalMinutes?: number;

  // Direct stats (only this project)
  directTasks?: number;
  directCompletedTasks?: number;
  directInProgressTasks?: number;
  directMinutes?: number;

  // Hierarchy metadata
  hasSubprojects?: boolean;
  isExpanded?: boolean;
}

// Auth-related extended types
export type PublicUser = Omit<User, 'passwordHash'>;

export interface UserWithDetails extends Omit<User, 'projectAccess'> {
  projectAccess?: ProjectUserWithDetails[];
  authSessions?: AuthSession[];
  userActivities?: UserActivity[];
}

export interface ProjectUserWithDetails extends ProjectUser {
  user?: User;
  project?: Project;
  grantedByUser?: User;
}

// Hierarchical project types
export interface ProjectNode extends ProjectWithDetails {
  parent?: ProjectNode;
  children?: ProjectNode[];
  hasChildren: boolean;
  pathArray: string[]; // ["Company A", "Project Alpha"]
  breadcrumb: string; // "Company A > Project Alpha"
}

export interface ProjectTreeData {
  roots: ProjectNode[]; // Top-level projects (parentId = null)
  flatMap: Map<number, ProjectNode>; // For quick lookups by ID
  pathMap: Map<string, ProjectNode>; // For path-based lookups
  maxDepth: number; // Maximum tree depth
}

export interface ProjectHierarchyStats {
  totalProjects: number;
  rootProjects: number;
  maxDepth: number;
  avgChildrenPerParent: number;
}

// API Response Types
export interface TaskEstimationAccuracy {
  taskId: number;
  timeAccuracy: number;      // percentage difference from estimate
  intensityMatch: boolean;   // exact intensity match
  estimatedMinutes: number;
  actualMinutes: number;
  estimatedIntensity: IntensityLevel;
  actualIntensity: IntensityLevel;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  totalMinutes: number;
  averageIntensity: number;
  completionRate: number;
  timeAccuracy: number;
}

export interface DailySummary {
  date: string;
  totalMinutes: number;
  tasksCompleted: number;
  averageIntensity: number;
  projectBreakdown: Array<{
    projectId: number;
    projectName: string;
    minutes: number;
    tasksCompleted: number;
  }>;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  totalTasks: number;
  dailySummaries: DailySummary[];
  topProjects: Array<{
    projectId: number;
    projectName: string;
    minutes: number;
    percentage: number;
  }>;
}

// Form Types
export interface TaskFormData {
  title: string;
  description?: string;
  linkUrl?: string;
  projectId: number;
  estimatedMinutes: number;
  estimatedIntensity: IntensityLevel;
  priority: Priority;
  dueDate?: Date;
  tags?: number[];
}

export interface ProjectFormData {
  name: string;
  color?: string;
  parentId?: number; // For creating sub-projects
}

export interface QuickLinkFormData {
  title: string;
  url: string;
  category?: LinkCategory;
  projectId: number;
}

// API Request/Response Types
export interface CreateTaskRequest {
  task: TaskFormData;
}

export interface UpdateTaskRequest {
  id: number;
  updates: Partial<TaskFormData>;
}

export interface CompleteTaskRequest {
  id: number;
  actualIntensity: IntensityLevel;
  actualMinutes?: number;
}

// Validation Types
export interface TaskValidation {
  title: { required: true; minLength: 1; maxLength: 500 };
  estimatedMinutes: { required: true; min: 1; max: 1440 }; // Max 24 hours
  estimatedIntensity: { required: true; min: 1; max: 5 };
  projectId: { required: true };
}

export interface ProjectValidation {
  name: { required: true; minLength: 1; maxLength: 255 };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  field: string;
  constraint: string;
}

// Utility Types
export type WithId<T> = T & { id: number };
export type WithTimestamps<T> = T & { 
  createdAt: Date; 
  updatedAt: Date; 
};
export type WithOptionalId<T> = T & { id?: number };

// Database Query Filters
export interface TaskFilters {
  status?: TaskStatus;
  projectId?: number;
  priority?: Priority;
  dueDate?: {
    before?: Date;
    after?: Date;
  };
  tags?: number[];
  search?: string;
}