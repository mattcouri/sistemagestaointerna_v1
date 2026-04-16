/*
  # Fix infinite recursion in user_organizations RLS policies

  ## Problem
  The user_organizations RLS policies used inline `SELECT FROM profiles WHERE is_admin = true`
  subqueries, which re-trigger the profiles SELECT policy, causing infinite recursion.

  ## Fix
  Replace all inline profile subqueries with the existing `is_admin_user()` SECURITY DEFINER
  function, which bypasses RLS when checking admin status.

  Also fix the profiles INSERT policy which had a missing WITH CHECK and ensure the
  "Admins can update any profile" policy also uses is_admin_user().
*/

-- Drop and recreate user_organizations policies using is_admin_user()
DROP POLICY IF EXISTS "Admins can manage user_organizations" ON user_organizations;
DROP POLICY IF EXISTS "Admins can insert user_organizations" ON user_organizations;
DROP POLICY IF EXISTS "Admins can delete user_organizations" ON user_organizations;

CREATE POLICY "Users and admins can select user_organizations"
  ON user_organizations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Admins can insert user_organizations"
  ON user_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete user_organizations"
  ON user_organizations
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Fix profiles "Admins can update any profile" to use is_admin_user()
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());
