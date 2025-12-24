// Core types for the Secret Santa game

export interface RoomState {
  openingOrder: string[]; // Randomized list of all 16 player names
  currentIndex: number; // Index into openingOrder
  roundStartedAt: number | null; // Timestamp when current round started (ms)
  durationSec: number; // Timer duration in seconds
  isStarted: boolean;
  resultsUnlocked: boolean; // Whether host has unlocked results for players
}

export interface Submission {
  playerName: string;
  roundIndex: number;
  guessedSantaName: string; // Who they think is the Secret Santa
  timestamp: number;
}

export type RoomStateListener = (state: RoomState) => void;
