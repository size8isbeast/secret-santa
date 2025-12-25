-- Add poll feature for best gift sender
-- Each player votes once for who gave the best gift

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  voted_for TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, voter_name)
);

-- Enable RLS
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their vote
CREATE POLICY "Anyone can insert poll votes"
  ON poll_votes FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read poll votes
CREATE POLICY "Anyone can read poll votes"
  ON poll_votes FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
