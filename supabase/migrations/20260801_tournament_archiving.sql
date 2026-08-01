-- Add is_archived to tournaments
ALTER TABLE tournaments ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
