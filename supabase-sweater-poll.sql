-- Add sweater poll feature for ugliest sweater vote
-- Each player votes once for who has the ugliest sweater

CREATE TABLE IF NOT EXISTS sweater_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  voted_for TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, voter_name)
);

-- Enable RLS
ALTER TABLE sweater_votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their vote
CREATE POLICY "Anyone can insert sweater votes"
  ON sweater_votes FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read sweater votes
CREATE POLICY "Anyone can read sweater votes"
  ON sweater_votes FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sweater_votes;

-- Add sweater_poll_unlocked field to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS sweater_poll_unlocked BOOLEAN DEFAULT false;
