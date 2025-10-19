-- Manual migration to fix schema issues
-- Run this before running drizzle-kit push

-- Step 1: Handle user_id type conversion in auth_sessions
-- First, check if there are any non-integer values
-- DELETE FROM auth_sessions WHERE user_id !~ '^[0-9]+$';

-- Convert user_id from varchar to integer with proper casting
ALTER TABLE auth_sessions ALTER COLUMN user_id TYPE integer USING (
  CASE 
    WHEN user_id ~ '^[0-9]+$' THEN user_id::integer
    ELSE NULL
  END
);

-- Make user_id nullable for anonymous sessions
ALTER TABLE auth_sessions ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS project_access text DEFAULT '[]' NOT NULL;

-- Step 3: Add missing columns to auth_sessions
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS ip_address varchar(45);
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS user_agent text;

-- Step 4: Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true NOT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by integer;

-- Step 5: Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- Add foreign key for auth_sessions.user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'auth_sessions_user_id_users_id_fk'
  ) THEN
    ALTER TABLE auth_sessions 
    ADD CONSTRAINT auth_sessions_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for projects.created_by
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'projects_created_by_users_id_fk'
  ) THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_created_by_users_id_fk 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for user_activities.user_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_activities_user_id_users_id_fk'
  ) THEN
    ALTER TABLE user_activities 
    ADD CONSTRAINT user_activities_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 6: Create project_users junction table for proper user-project permissions
CREATE TABLE IF NOT EXISTS project_users (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  permission_level varchar(20) NOT NULL DEFAULT 'view_only' CHECK (permission_level IN ('view_only', 'editor', 'project_admin')),
  granted_by integer REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(user_id, project_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON project_users(user_id);
CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_permission ON project_users(permission_level);

-- Add comments for documentation
COMMENT ON TABLE project_users IS 'Junction table for user-project permissions with granular access control';
COMMENT ON COLUMN project_users.permission_level IS 'Permission levels: view_only (read), editor (read/write), project_admin (full control)';
COMMENT ON COLUMN projects.is_public IS 'If true, project is visible to all users (including anonymous). If false, only assigned users can access.';
COMMENT ON COLUMN projects.created_by IS 'User who created this project, automatically gets project_admin permission';
