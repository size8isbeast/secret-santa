-- Add game mode support to submissions table
-- Risk mode: 1 guess = 3 points if correct
-- Safe mode: up to 3 guesses = 1 point if any correct

-- Add game_mode column
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'risk' CHECK (game_mode IN ('risk', 'safe'));

-- Modify guessed_santa_name to allow multiple choices (for safe mode)
-- Store as JSON array for safe mode, single string for risk mode
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS guessed_santas TEXT[] DEFAULT '{}';

-- Migrate existing data
UPDATE submissions
SET guessed_santas = ARRAY[guessed_santa_name]
WHERE guessed_santas = '{}';

-- Note: We'll keep guessed_santa_name for backward compatibility
-- but new submissions will use guessed_santas array
