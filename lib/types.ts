// Core types for the Secret Santa game

export interface RoomState {
  openingOrder: string[]; // Randomized list of all 16 player names
  currentIndex: number; // Index into openingOrder
  roundStartedAt: number | null; // Timestamp when current round started (ms)
  durationSec: number; // Timer duration in seconds
  isStarted: boolean;
  resultsUnlocked: boolean; // Whether host has unlocked results for players
  pollUnlocked: boolean; // Whether host has unlocked gift poll for players
  sweaterPollUnlocked: boolean; // Whether host has unlocked sweater poll for players
}

export type GameMode = 'risk' | 'safe';

export interface Submission {
  playerName: string;
  roundIndex: number;
  guessedSantaName: string; // Who they think is the Secret Santa (legacy)
  guessedSantas: string[]; // Array of guesses (supports safe mode)
  gameMode: GameMode; // 'risk' (1 guess, 3 points) or 'safe' (3 guesses, 1 point)
  timestamp: number;
}

export type RoomStateListener = (state: RoomState) => void;
