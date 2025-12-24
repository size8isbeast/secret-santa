-- Add active_players column to track who has entered the game
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS active_players TEXT[] DEFAULT '{}';

COMMENT ON COLUMN rooms.active_players IS 'Array of player names who have entered the game';
