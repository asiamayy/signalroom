-- Add archived field to personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS archived_at timestamptz;
