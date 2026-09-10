-- Add missing schema columns for schedules that are actively used in the application
-- but were never tracked in source control migrations.

ALTER TABLE schedules ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS score_a INTEGER;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS score_b INTEGER;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_time TIME;
