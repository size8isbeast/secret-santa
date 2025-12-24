-- Add results_unlocked field to track when host has viewed results
-- This allows players to access results only after host has unlocked them

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS results_unlocked BOOLEAN DEFAULT FALSE;

-- Function to unlock results (called when host visits results page)
CREATE OR REPLACE FUNCTION unlock_results(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rooms
  SET results_unlocked = TRUE
  WHERE id = p_room_id;

  RETURN TRUE;
END;
$$;
