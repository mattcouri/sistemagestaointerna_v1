/*
  # Add time and date fields to tasks table

  ## Changes
  - `start_time` (text, nullable) — e.g. "09:00"
  - `end_time` (text, nullable) — e.g. "10:00"
  - `duration_minutes` (integer, nullable) — used when "use duration instead of end time" is checked
  - `no_time_assigned` (boolean, default false) — checkbox: no time or duration assigned
  - `use_duration` (boolean, default false) — checkbox: use duration instead of end time
  - `goal_date` (date, nullable) — goal date for the task
  - `limit_date` (date, nullable) — hard deadline date for the task
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN start_time text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN end_time text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN duration_minutes integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'no_time_assigned'
  ) THEN
    ALTER TABLE tasks ADD COLUMN no_time_assigned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'use_duration'
  ) THEN
    ALTER TABLE tasks ADD COLUMN use_duration boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'goal_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN goal_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'limit_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN limit_date date;
  END IF;
END $$;
