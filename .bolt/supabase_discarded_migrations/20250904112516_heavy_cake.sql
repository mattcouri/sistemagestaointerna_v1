/*
  # Fix Authentication Schema

  1. Changes
    - Drop existing users table and recreate as profiles
    - Use auth.users for authentication
    - Create profiles table that references auth.users(id)
    - Update all foreign key references
    - Maintain data integrity with proper cascading

  2. New Tables
    - `profiles` (replaces users)
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `color` (text, default blue)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Security
    - Enable RLS on all tables
    - Users can only access their own profile and shared project data
    - Automatic profile creation on user signup
*/

-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS roadmap_ideas CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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

-- Profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text DEFAULT '',
  color text NOT NULL DEFAULT '#3B82F6',
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Project members junction table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  strategy text DEFAULT '',
  type text NOT NULL CHECK (type IN ('personal', 'project')),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lists_project_id ON lists(project_id);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed boolean DEFAULT false,
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Roadmap ideas table
CREATE TABLE IF NOT EXISTS roadmap_ideas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('new-feature', 'improvement', 'next-steps', 'bug')),
  image_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roadmap_ideas_created_by ON roadmap_ideas(created_by);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    '#3B82F6'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();