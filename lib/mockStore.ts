// Mock in-memory store that simulates realtime updates
// Later this will be replaced with Supabase Realtime + tables

import { RoomState, Submission, RoomStateListener } from './types';

// Player names (2 for testing, can be expanded to 16)
export const ALL_PLAYERS = [
  'Alice',
  'Bob',
];

class MockStore {
  private roomState: RoomState = {
    openingOrder: [],
    currentIndex: 0,
    roundStartedAt: null,
    durationSec: 90, // Default 90 seconds per round
    isStarted: false,
    resultsUnlocked: false,
  };

  private activePlayers: Set<string> = new Set();
  private submissions: Map<string, Submission> = new Map();
  private listeners: Set<RoomStateListener> = new Set();

  // Subscribe to room state changes (simulates Supabase Realtime)
  subscribe(listener: RoomStateListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getRoomState());
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getRoomState();
    this.listeners.forEach((listener) => listener(state));
  }

  // Get current room state
  getRoomState(): RoomState {
    return { ...this.roomState };
  }

  // Player: Register as active player
  registerPlayer(playerName: string): void {
    this.activePlayers.add(playerName);
  }

  // Host: Start the game with randomized order
  startGame(): void {
    // Use active players if any, otherwise fall back to ALL_PLAYERS
    const playersArray = this.activePlayers.size > 0
      ? Array.from(this.activePlayers)
      : ALL_PLAYERS;
    const shuffled = [...playersArray].sort(() => Math.random() - 0.5);
    this.roomState = {
      openingOrder: shuffled,
      currentIndex: 0,
      roundStartedAt: Date.now(),
      durationSec: this.roomState.durationSec,
      isStarted: true,
    };
    this.notifyListeners();
  }

  // Host: Advance to next recipient
  nextRecipient(): void {
    if (!this.roomState.isStarted) return;
    if (this.roomState.currentIndex >= this.roomState.openingOrder.length - 1) {
      // Game over
      return;
    }
    this.roomState = {
      ...this.roomState,
      currentIndex: this.roomState.currentIndex + 1,
      roundStartedAt: Date.now(),
    };
    this.notifyListeners();
  }

  // Host: Update timer duration
  setTimerDuration(seconds: number): void {
    this.roomState = {
      ...this.roomState,
      durationSec: seconds,
    };
    this.notifyListeners();
  }

  // Player: Submit a guess for current round
  submitGuess(playerName: string, roundIndex: number, guessedSantaName: string): boolean {
    // Check if already submitted for this round
    const key = `${playerName}-${roundIndex}`;
    if (this.submissions.has(key)) {
      return false; // Already submitted
    }

    const submission: Submission = {
      playerName,
      roundIndex,
      guessedSantaName,
      timestamp: Date.now(),
    };
    this.submissions.set(key, submission);
    return true;
  }

  // Player: Check if already submitted for a round
  hasSubmitted(playerName: string, roundIndex: number): boolean {
    const key = `${playerName}-${roundIndex}`;
    return this.submissions.has(key);
  }

  // Get all submissions
  getAllSubmissions(): any[] {
    return Array.from(this.submissions.values()).map((sub) => ({
      player_name: sub.playerName,
      round_index: sub.roundIndex,
      guessed_santa_name: sub.guessedSantaName,
      created_at: new Date(sub.timestamp).toISOString(),
    }));
  }

  // Get current recipient name
  getCurrentRecipient(): string | null {
    if (!this.roomState.isStarted || this.roomState.openingOrder.length === 0) {
      return null;
    }
    return this.roomState.openingOrder[this.roomState.currentIndex] ?? null;
  }

  // Get active players who have entered
  getActivePlayers(): string[] {
    return Array.from(this.activePlayers);
  }

  // Unlock results (called when host visits results page)
  unlockResults(): void {
    this.roomState = {
      ...this.roomState,
      resultsUnlocked: true,
    };
    this.notifyListeners();
  }

  // Reset the entire game (for testing)
  reset(): void {
    this.roomState = {
      openingOrder: [],
      currentIndex: 0,
      roundStartedAt: null,
      durationSec: 90,
      isStarted: false,
      resultsUnlocked: false,
    };
    this.activePlayers.clear();
    this.submissions.clear();
    this.notifyListeners();
  }
}

// Singleton instance
export const mockStore = new MockStore();
