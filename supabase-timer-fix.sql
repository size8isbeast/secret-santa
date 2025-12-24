-- Timer Sync Fix: Add server-side functions to handle timestamps
-- Run this SQL in your Supabase SQL Editor to fix timer synchronization issues

-- Function to start the game with server-side timestamp
CREATE OR REPLACE FUNCTION start_game_with_server_time(
  p_room_id UUID,
  p_opening_order TEXT[]
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  server_time TIMESTAMP WITH TIME ZONE;
BEGIN
  server_time := NOW();

  UPDATE rooms
  SET
    opening_order = p_opening_order,
    current_index = 0,
    round_started_at = server_time,
    is_started = true,
    updated_at = server_time
  WHERE id = p_room_id;

  RETURN server_time;
END;
$$;

-- Function to advance to next round with server-side timestamp
CREATE OR REPLACE FUNCTION next_round_with_server_time(
  p_room_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  server_time TIMESTAMP WITH TIME ZONE;
BEGIN
  server_time := NOW();

  UPDATE rooms
  SET
    current_index = current_index + 1,
    round_started_at = server_time,
    updated_at = server_time
  WHERE id = p_room_id;

  RETURN server_time;
END;
$$;

-- Grant execute permissions (adjust if you have specific roles)
GRANT EXECUTE ON FUNCTION start_game_with_server_time TO anon, authenticated;
GRANT EXECUTE ON FUNCTION next_round_with_server_time TO anon, authenticated;
