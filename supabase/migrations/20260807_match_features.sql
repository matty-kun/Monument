-- Add new columns to schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS stream_url TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS context TEXT;

-- Create match_predictions table
CREATE TABLE IF NOT EXISTS match_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent multiple votes from the same IP for a single match
CREATE UNIQUE INDEX IF NOT EXISTS match_predictions_single_vote_idx 
ON match_predictions(schedule_id, ip_hash);

-- Enable RLS
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow public read access for match_predictions"
ON match_predictions
FOR SELECT
USING (true);

-- Allow anonymous insert access (since voters don't need to be logged in)
CREATE POLICY "Allow anonymous insert for match_predictions"
ON match_predictions
FOR INSERT
WITH CHECK (true);
