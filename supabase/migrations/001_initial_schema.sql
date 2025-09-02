/*
  # Initial Schema for Team Kanban Dashboard

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `color` (text, default blue)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `color` (text, default blue)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `project_members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
    
    - `lists`
      - `id` (uuid, primary key)
      - `title` (text)
      - `strategy` (text)
      - `type` (text, 'personal' or 'project')
      - `project_id` (uuid, foreign key to projects, nullable)
      - `user_id` (uuid, foreign key to users)
      - `color` (text, nullable)
      - `position` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `tag` (text, unique)
      - `title` (text)
      - `description` (text, nullable)
      - `priority` (text, 'low', 'medium', 'high')
      - `completed` (boolean, default false)
      - `list_id` (uuid, foreign key to lists)
      - `assigned_to` (uuid, foreign key to users, nullable)
      - `due_date` (timestamp, nullable)
      - `position` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `roadmap_ideas`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text, 'new-feature', 'improvement', 'next-steps', 'bug')
      - `image_url` (text, nullable)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for project collaboration
    - Add policies for roadmap idea sharing

  3. Functions
    - Add trigger function for updating `updated_at` timestamps
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own profile"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text DEFAULT '',
    color text NOT NULL DEFAULT '#3B82F6',
    created_by uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create projects"
    ON projects
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can read projects they're members of"
    ON projects
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        ) OR created_by = auth.uid()
    );

CREATE POLICY "Project creators can update projects"
    ON projects
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Project creators can delete projects"
    ON projects
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project creators can manage members"
    ON project_members
    FOR ALL
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can read project members for their projects"
    ON project_members
    FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    strategy text DEFAULT '',
    type text NOT NULL CHECK (type IN ('personal', 'project')),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    color text,
    position integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lists"
    ON lists
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can read their own lists"
    ON lists
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can read project lists they're members of"
    ON lists
    FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_project_id ON lists(project_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completed boolean DEFAULT false,
    list_id uuid REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
    assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
    due_date timestamptz,
    position integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tasks in their lists"
    ON tasks
    FOR ALL
    TO authenticated
    USING (
        list_id IN (
            SELECT id FROM lists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read tasks from their lists"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (
        list_id IN (
            SELECT id FROM lists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read tasks from project lists they're members of"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (
        list_id IN (
            SELECT l.id FROM lists l
            JOIN project_members pm ON l.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage tasks in project lists they're members of"
    ON tasks
    FOR ALL
    TO authenticated
    USING (
        list_id IN (
            SELECT l.id FROM lists l
            JOIN project_members pm ON l.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Roadmap ideas table
CREATE TABLE IF NOT EXISTS roadmap_ideas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL CHECK (category IN ('new-feature', 'improvement', 'next-steps', 'bug')),
    image_url text,
    created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE roadmap_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create roadmap ideas"
    ON roadmap_ideas
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can read all roadmap ideas"
    ON roadmap_ideas
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own roadmap ideas"
    ON roadmap_ideas
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own roadmap ideas"
    ON roadmap_ideas
    FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

CREATE TRIGGER update_roadmap_ideas_updated_at
    BEFORE UPDATE ON roadmap_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_roadmap_ideas_created_by ON roadmap_ideas(created_by);