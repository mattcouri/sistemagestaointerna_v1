/*
  # Fix profiles RLS policy that uses a self-join on project_members

  ## Problem
  The "Project co-members can view profiles" policy used a self-join on project_members
  (pm1 JOIN pm2) which, combined with the now-fixed project_members SELECT policy,
  could still trigger recursion or performance issues.

  ## Fix
  Rewrite the policy to avoid the self-join by using two separate subqueries:
  - Check if the viewer (auth.uid()) is a member of any project
  - Check if the target profile user is also a member of any of those same projects
  This is logically equivalent but avoids the self-join pattern.
*/

DROP POLICY IF EXISTS "Project co-members can view profiles" ON profiles;

CREATE POLICY "Project co-members can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id IN (
      SELECT pm.user_id
      FROM project_members pm
      WHERE pm.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );
