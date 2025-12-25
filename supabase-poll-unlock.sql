-- Add poll_unlocked field to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS poll_unlocked BOOLEAN DEFAULT false;
