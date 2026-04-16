/*
  # Fix infinite recursion in profiles RLS policy

  ## Problem
  The profiles SELECT policy checks `is_admin` by querying `public.profiles` itself:
    EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.is_admin = true)
  This causes infinite recursion because evaluating the policy triggers the same policy again.

  ## Fix
  1. Create a SECURITY DEFINER helper function `is_admin_user()` that reads `is_admin`
     from the profiles table while bypassing RLS. This breaks the recursion.
  2. Rebuild the profiles SELECT policy to use this helper instead of the self-referencing subquery.
*/

-- Helper: check if the current user is an admin (bypasses RLS to avoid self-referencing recursion)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Rebuild profiles SELECT policy without self-referencing subquery
DROP POLICY IF EXISTS "Users can view own and co-member profiles" ON profiles;

CREATE POLICY "Users can view own and co-member profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin_user()
    OR id IN (
      SELECT user_id FROM public.project_members
      WHERE project_id IN (SELECT public.get_user_project_ids(auth.uid()))
    )
  );
