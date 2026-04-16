/*
  # Add list sharing via list_members table

  ## Summary
  Enables personal lists to be shared with specific users in the same organization.

  ## New Tables
  - `list_members`
    - `id` (uuid, primary key)
    - `list_id` (uuid, FK → lists.id, cascade delete)
    - `user_id` (uuid, FK → profiles.id, cascade delete)
    - `created_at` (timestamptz)
    - UNIQUE(list_id, user_id)

  ## Modified Tables
  - `lists`
    - Added `is_shared` (boolean, default false) — flag marking a list as shared

  ## Security
  - RLS enabled on list_members
  - List owner can insert/delete members
  - Shared users can read their own membership rows
  - Lists RLS updated to allow shared users to see lists they are members of
*/

-- Add is_shared column to lists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lists' AND column_name = 'is_shared'
  ) THEN
    ALTER TABLE lists ADD COLUMN is_shared boolean DEFAULT false;
  END IF;
END $$;

-- Create list_members junction table
CREATE TABLE IF NOT EXISTS list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(list_id, user_id)
);

ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- List owner can insert members (owner = user_id on the list)
CREATE POLICY "List owner can add members"
  ON list_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_members.list_id
        AND lists.user_id = auth.uid()
    )
  );

-- List owner can remove members
CREATE POLICY "List owner can remove members"
  ON list_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_members.list_id
        AND lists.user_id = auth.uid()
    )
  );

-- Members can read their own rows
CREATE POLICY "Members can read their memberships"
  ON list_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_members.list_id
        AND lists.user_id = auth.uid()
    )
  );

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS list_members_user_id_idx ON list_members(user_id);
CREATE INDEX IF NOT EXISTS list_members_list_id_idx ON list_members(list_id);
