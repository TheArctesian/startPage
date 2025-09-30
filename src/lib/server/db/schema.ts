import { 
  pgTable, 
  serial, 
  integer, 
  varchar, 
  text, 
  timestamp, 
  boolean,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const linkCategoryEnum = pgEnum('link_category', ['docs', 'tools', 'resources', 'other']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'done', 'archived']);

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 50 }).default('--nord8'),
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').default(true),
  status: projectStatusEnum('status').default('active').notNull(),
  
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

export const timeSessions = pgTable('time_sessions', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'),
  isActive: boolean('is_active').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const quickLinks = pgTable('quick_links', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  url: text('url').notNull(),
  icon: varchar('icon', { length: 50 }),
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

export const projectsRelations = relations(projects, ({ one, many }) => ({
  tasks: many(tasks),
  quickLinks: many(quickLinks),
  timeSessions: many(timeSessions),
  
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
  timeSessions: many(timeSessions),
  taskTags: many(taskTags)
}));

export const timeSessionsRelations = relations(timeSessions, ({ one }) => ({
  task: one(tasks, {
    fields: [timeSessions.taskId],
    references: [tasks.id]
  }),
  project: one(projects, {
    fields: [timeSessions.projectId],
    references: [projects.id]
  })
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
