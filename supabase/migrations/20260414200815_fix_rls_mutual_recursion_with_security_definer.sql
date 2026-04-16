/*
  # Fix mutual RLS recursion between projects and project_members

  ## Problem
  There is a mutual recursion loop:
  - projects SELECT policy queries project_members
  - project_members ALL/SELECT policy queries projects (via created_by check)
  - These reference each other causing infinite recursion on every authenticated request

  ## Fix
  1. Create a SECURITY DEFINER helper function that bypasses RLS to check project ownership.
     This breaks the recursion cycle cleanly.
  2. Rebuild project_members policies to use this helper.
  3. Keep projects policy simple - it queries project_members but project_members
     no longer queries back to projects.

  The helper function runs as the function owner (superuser context) so it
  can read projects.created_by without triggering the projects RLS policy.
*/

-- Helper: check if a user created a project (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_project_creator(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND created_by = p_user_id
  );
$$;

-- Helper: get all project_ids where the user is a direct member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_project_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT project_id FROM public.project_members WHERE user_id = p_user_id;
$$;

-- Rebuild project_members policies without referencing projects table
DROP POLICY IF EXISTS "Project creators can manage members" ON project_members;
DROP POLICY IF EXISTS "Users can read project members for their projects" ON project_members;

CREATE POLICY "Users can read project members for their projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_project_creator(project_id, auth.uid())
  );

CREATE POLICY "Project creators can insert members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_creator(project_id, auth.uid())
  );

CREATE POLICY "Project creators can update members"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (public.is_project_creator(project_id, auth.uid()))
  WITH CHECK (public.is_project_creator(project_id, auth.uid()));

CREATE POLICY "Project creators can delete members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (public.is_project_creator(project_id, auth.uid()));

-- Rebuild projects SELECT policy - queries project_members but that no longer loops back
DROP POLICY IF EXISTS "Users can read projects they're members of" ON projects;

CREATE POLICY "Users can read projects they're members of"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (SELECT public.get_user_project_ids(auth.uid()))
  );

-- Fix profiles: drop the USING(true) policy and the co-members policy, consolidate
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Project co-members can view profiles" ON profiles;

CREATE POLICY "Users can view own and co-member profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM public.project_members
      WHERE project_id IN (SELECT public.get_user_project_ids(auth.uid()))
    )
    OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.is_admin = true)
  );
