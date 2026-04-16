/*
  # Initial Schema for Team Kanban Dashboard

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `projects` - Team projects
    - `project_members` - Junction table for project membership
    - `lists` - Kanban lists (personal and project)
    - `tasks` - Individual tasks within lists
    - `roadmap_ideas` - Development roadmap ideas

  2. Security
    - RLS enabled on all tables
    - Policies scoped to authenticated users and ownership

  3. Triggers
    - Auto-update `updated_at` on row changes
    - Auto-create profile on new user signup
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text DEFAULT '',
  color text NOT NULL DEFAULT '#3B82F6',
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  strategy text DEFAULT '',
  type text NOT NULL CHECK (type IN ('personal', 'project')),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  color text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag text NOT NULL UNIQUE,
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_ideas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can read all profiles') THEN
    CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='Users can read projects they''re members of') THEN
    CREATE POLICY "Users can read projects they're members of" ON projects FOR SELECT TO authenticated
      USING (id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()) OR created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='Users can create projects') THEN
    CREATE POLICY "Users can create projects" ON projects FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='Project creators can update projects') THEN
    CREATE POLICY "Project creators can update projects" ON projects FOR UPDATE TO authenticated USING (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='projects' AND policyname='Project creators can delete projects') THEN
    CREATE POLICY "Project creators can delete projects" ON projects FOR DELETE TO authenticated USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_members' AND policyname='Users can read project members for their projects') THEN
    CREATE POLICY "Users can read project members for their projects" ON project_members FOR SELECT TO authenticated
      USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_members' AND policyname='Project creators can manage members') THEN
    CREATE POLICY "Project creators can manage members" ON project_members FOR ALL TO authenticated
      USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lists' AND policyname='Users can read their own lists') THEN
    CREATE POLICY "Users can read their own lists" ON lists FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lists' AND policyname='Users can read project lists they''re members of') THEN
    CREATE POLICY "Users can read project lists they're members of" ON lists FOR SELECT TO authenticated
      USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lists' AND policyname='Users can manage their own lists') THEN
    CREATE POLICY "Users can manage their own lists" ON lists FOR ALL TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Users can read tasks from their lists') THEN
    CREATE POLICY "Users can read tasks from their lists" ON tasks FOR SELECT TO authenticated
      USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Users can read tasks from project lists they''re members of') THEN
    CREATE POLICY "Users can read tasks from project lists they're members of" ON tasks FOR SELECT TO authenticated
      USING (list_id IN (SELECT l.id FROM lists l JOIN project_members pm ON l.project_id = pm.project_id WHERE pm.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Users can manage tasks in their lists') THEN
    CREATE POLICY "Users can manage tasks in their lists" ON tasks FOR ALL TO authenticated
      USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Users can manage tasks in project lists they''re members of') THEN
    CREATE POLICY "Users can manage tasks in project lists they're members of" ON tasks FOR ALL TO authenticated
      USING (list_id IN (SELECT l.id FROM lists l JOIN project_members pm ON l.project_id = pm.project_id WHERE pm.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='roadmap_ideas' AND policyname='Users can read all roadmap ideas') THEN
    CREATE POLICY "Users can read all roadmap ideas" ON roadmap_ideas FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='roadmap_ideas' AND policyname='Users can create roadmap ideas') THEN
    CREATE POLICY "Users can create roadmap ideas" ON roadmap_ideas FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='roadmap_ideas' AND policyname='Users can update their own roadmap ideas') THEN
    CREATE POLICY "Users can update their own roadmap ideas" ON roadmap_ideas FOR UPDATE TO authenticated USING (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='roadmap_ideas' AND policyname='Users can delete their own roadmap ideas') THEN
    CREATE POLICY "Users can delete their own roadmap ideas" ON roadmap_ideas FOR DELETE TO authenticated USING (created_by = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_project_id ON lists(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_roadmap_ideas_created_by ON roadmap_ideas(created_by);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lists_updated_at') THEN
    CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_roadmap_ideas_updated_at') THEN
    CREATE TRIGGER update_roadmap_ideas_updated_at BEFORE UPDATE ON roadmap_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;
