-- Add table to track the actual Santa for each round
-- This allows the host to mark who the actual Secret Santa was
-- and calculate points based on correct guesses

CREATE TABLE IF NOT EXISTS actual_santas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL,
  actual_santa_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, round_index)
);

-- Enable RLS
ALTER TABLE actual_santas ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since we're using anon key)
CREATE POLICY "Enable all operations for actual_santas" ON actual_santas
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE actual_santas;

-- Create index for faster lookups
CREATE INDEX idx_actual_santas_room_id ON actual_santas(room_id);
CREATE INDEX idx_actual_santas_round_index ON actual_santas(room_id, round_index);
