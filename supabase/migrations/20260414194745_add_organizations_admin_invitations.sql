/*
  # Add Organizations, Admin Flag, and Project Invitations

  ## Summary
  Extends schema to support:
  - Organizations with membership
  - Admin role for user management
  - Project invitations for shared project collaboration

  ## New Tables
  - organizations: Team/company groupings
  - organization_members: Many-to-many org membership
  - project_invitations: Invitation system for project sharing

  ## Modified Tables
  - profiles: Added is_admin (boolean) and organization_id (uuid)

  ## Security
  - RLS on all new tables
  - Admins can manage all profiles and organizations
  - Users see only relevant invitations
*/

-- Add admin flag and organization reference to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_id uuid;
  END IF;
END $$;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Project invitations table
CREATE TABLE IF NOT EXISTS project_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, invited_user_id)
);

ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- Add FK from profiles to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_organization_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS Policies: Organizations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Authenticated users can view organizations') THEN
    CREATE POLICY "Authenticated users can view organizations"
      ON organizations FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Admins can insert organizations') THEN
    CREATE POLICY "Admins can insert organizations"
      ON organizations FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Admins can update organizations') THEN
    CREATE POLICY "Admins can update organizations"
      ON organizations FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Admins can delete organizations') THEN
    CREATE POLICY "Admins can delete organizations"
      ON organizations FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

-- RLS Policies: Organization Members
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'Users can view organization members') THEN
    CREATE POLICY "Users can view organization members"
      ON organization_members FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'Admins can insert organization members') THEN
    CREATE POLICY "Admins can insert organization members"
      ON organization_members FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'Admins can delete organization members') THEN
    CREATE POLICY "Admins can delete organization members"
      ON organization_members FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

-- RLS Policies: Project Invitations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_invitations' AND policyname = 'Users can view their own invitations') THEN
    CREATE POLICY "Users can view their own invitations"
      ON project_invitations FOR SELECT TO authenticated
      USING (invited_user_id = auth.uid() OR invited_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_invitations' AND policyname = 'Project members can send invitations') THEN
    CREATE POLICY "Project members can send invitations"
      ON project_invitations FOR INSERT TO authenticated
      WITH CHECK (
        invited_by = auth.uid() AND
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_id = project_invitations.project_id AND user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_invitations' AND policyname = 'Invited users can update invitation status') THEN
    CREATE POLICY "Invited users can update invitation status"
      ON project_invitations FOR UPDATE TO authenticated
      USING (invited_user_id = auth.uid() OR invited_by = auth.uid())
      WITH CHECK (invited_user_id = auth.uid() OR invited_by = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_invitations' AND policyname = 'Project members can delete invitations') THEN
    CREATE POLICY "Project members can delete invitations"
      ON project_invitations FOR DELETE TO authenticated
      USING (
        invited_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- Update profiles policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update any profile') THEN
    CREATE POLICY "Admins can update any profile"
      ON profiles FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Project co-members can view profiles') THEN
    CREATE POLICY "Project co-members can view profiles"
      ON profiles FOR SELECT TO authenticated
      USING (
        id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm1
          JOIN project_members pm2 ON pm1.project_id = pm2.project_id
          WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
        )
      );
  END IF;
END $$;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
    CREATE TRIGGER update_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_invitations_updated_at') THEN
    CREATE TRIGGER update_project_invitations_updated_at
      BEFORE UPDATE ON project_invitations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_invited_user ON project_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Mark the existing profile (Matt) as admin
UPDATE profiles SET is_admin = true WHERE email = 'matt@trinitygroup.com.br';
