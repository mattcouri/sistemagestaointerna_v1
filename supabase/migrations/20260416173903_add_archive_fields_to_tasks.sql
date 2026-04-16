/*
  # Add Archive Fields to Tasks

  ## Summary
  Adds two new timestamp columns to the tasks table to support the Completed Tasks Archive feature.

  ## Changes
  - `completed_at` (timestamptz): Records the exact moment a task was marked as completed.
  - `archived_at` (timestamptz): Records the date/time a completed task was moved to the archive.
    When NULL, the task is active (not archived). When set, the task is in the archive.

  ## Notes
  - Both columns are nullable - NULL means "not yet completed/archived"
  - Existing tasks will have NULL for both columns (backward compatible)
  - No RLS changes needed; tasks inherit their list's access control
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN archived_at timestamptz;
  END IF;
END $$;
