import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const linkCategoryEnum = pgEnum('link_category', ['docs', 'tools', 'resources', 'other']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'done', 'archived']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);
export const userStatusEnum = pgEnum('user_status', ['pending', 'approved', 'suspended']);
export const permissionLevelEnum = pgEnum('permission_level', ['view_only', 'editor', 'project_admin']);

// Users table - replaces settings table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  email: varchar('email', { length: 255 }),
  role: userRoleEnum('role').default('member').notNull(),
  status: userStatusEnum('status').default('pending').notNull(),
  projectAccess: text('project_access').default('[]').notNull(), // JSON array of project IDs user can access
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 50 }).default('--nord8'),
  isActive: boolean('is_active').default(true),
  status: projectStatusEnum('status').default('active').notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  
  // Hierarchical fields
  parentId: integer('parent_id').references(() => projects.id, { onDelete: 'cascade' }),
  path: varchar('path', { length: 1000 }), // For efficient querying and breadcrumbs
  depth: integer('depth').default(0), // Tree depth (0 = root)
  isExpanded: boolean('is_expanded').default(true), // UI state for tree navigation
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  linkUrl: text('link_url'),
  status: taskStatusEnum('status').default('todo').notNull(),
  priority: priorityEnum('priority').default('medium').notNull(),

  estimatedMinutes: integer('estimated_minutes').notNull(),
  estimatedIntensity: integer('estimated_intensity').notNull(),
  actualMinutes: integer('actual_minutes'),
  actualIntensity: integer('actual_intensity'),

  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  boardColumn: varchar('board_column', { length: 100 }),
  position: integer('position')
});

export const quickLinks = pgTable('quick_links', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  url: text('url').notNull(),
  category: linkCategoryEnum('category'),
  position: integer('position').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  color: varchar('color', { length: 50 })
});

export const taskTags = pgTable('task_tags', {
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' })
});

// Project-User permissions junction table
export const projectUsers = pgTable('project_users', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  permissionLevel: permissionLevelEnum('permission_level').default('view_only').notNull(),
  grantedBy: integer('granted_by').references(() => users.id, { onDelete: 'set null' }),
  grantedAt: timestamp('granted_at').defaultNow().notNull()
}, (table) => ({
  // Composite unique constraint for onConflictDoUpdate
  userProjectUnique: unique().on(table.userId, table.projectId)
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  authSessions: many(authSessions),
  userActivities: many(userActivities),
  projectAccess: many(projectUsers)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  tasks: many(tasks),
  quickLinks: many(quickLinks),
  createdByUser: one(users, {
    fields: [projects.createdBy],
    references: [users.id]
  }),
  userAccess: many(projectUsers),

  // Hierarchical relations
  parent: one(projects, {
    fields: [projects.parentId],
    references: [projects.id],
    relationName: 'parentChild'
  }),
  children: many(projects, {
    relationName: 'parentChild'
  })
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id]
  }),
  taskTags: many(taskTags)
}));

export const quickLinksRelations = relations(quickLinks, ({ one }) => ({
  project: one(projects, {
    fields: [quickLinks.projectId],
    references: [projects.id]
  })
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags)
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id]
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id]
  })
}));

// Authentication and permission tables
export const authSessions = pgTable('auth_sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // nullable for anonymous sessions
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});


export const userActivities = pgTable('user_activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(), // 'login', 'create', 'update', 'delete'
  resourceType: varchar('resource_type', { length: 50 }), // 'task', 'project', 'link'
  resourceId: integer('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  details: text('details'), // JSON string with additional context
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Additional relations for new tables
export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id]
  })
}));


export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id]
  })
}));

export const projectUsersRelations = relations(projectUsers, ({ one }) => ({
  user: one(users, {
    fields: [projectUsers.userId],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [projectUsers.projectId],
    references: [projects.id]
  }),
  grantedByUser: one(users, {
    fields: [projectUsers.grantedBy],
    references: [users.id]
  })
}));
