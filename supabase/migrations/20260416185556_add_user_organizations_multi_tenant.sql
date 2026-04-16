/*
  # Multi-Tenant Organization Support

  ## Summary
  Implements true multi-tenancy by allowing users to belong to multiple organizations.
  All data (projects, lists) is scoped to organizations so users only see data
  belonging to their assigned organizations.

  ## Changes

  ### New Tables
  - `user_organizations`: Many-to-many join table between users and organizations
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to profiles)
    - `organization_id` (uuid, FK to organizations)
    - `created_at` (timestamp)
    - Unique constraint on (user_id, organization_id)

  ### Modified Tables
  - `projects`: Add `organization_id` column (nullable FK to organizations)
  - `lists`: Add `organization_id` column (nullable FK to organizations)

  ### Security
  - RLS enabled on user_organizations
  - Admins can manage all user_organization memberships
  - Users can view their own memberships
  - Projects and lists maintain existing RLS

  ### Notes
  1. Existing data is preserved; organization_id columns are nullable for backwards compatibility
  2. The user_organizations table replaces the single organization_id on profiles for membership tracking
  3. profiles.organization_id is kept for backwards compatibility but user_organizations is the source of truth
*/

-- Create user_organizations many-to-many table
CREATE TABLE IF NOT EXISTS user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_organizations"
  ON user_organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can insert user_organizations"
  ON user_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete user_organizations"
  ON user_organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add organization_id to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add organization_id to lists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lists' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE lists ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Migrate existing single organization_id memberships to user_organizations table
INSERT INTO user_organizations (user_id, organization_id)
SELECT id, organization_id
FROM profiles
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_lists_organization_id ON lists(organization_id);
