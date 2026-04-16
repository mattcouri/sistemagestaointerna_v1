/*
  # Fix infinite recursion in project_members RLS policies

  ## Problem
  The SELECT policy on project_members was referencing project_members itself,
  causing infinite recursion when any query touched that table.

  ## Fix
  Replace the self-referencing SELECT policy with a direct ownership check:
  a user can see project_members rows if they are that member (user_id = auth.uid())
  OR if they are the project creator (via projects table).

  This avoids any self-reference on project_members.
*/

DROP POLICY IF EXISTS "Users can read project members for their projects" ON project_members;

CREATE POLICY "Users can read project members for their projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );
