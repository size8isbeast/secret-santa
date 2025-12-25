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
    pollUnlocked: false,
    sweaterPollUnlocked: false,
  };

  private activePlayers: Set<string> = new Set();
  private submissions: Map<string, Submission> = new Map();
  private actualSantas: Map<number, string> = new Map(); // round_index -> actual_santa_name
  private pollVotes: Map<string, string> = new Map(); // voter_name -> voted_for
  private sweaterVotes: Map<string, string> = new Map(); // voter_name -> voted_for
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
      resultsUnlocked: false,
      pollUnlocked: false,
      sweaterPollUnlocked: false,
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
  submitGuess(
    playerName: string,
    roundIndex: number,
    guessedSantas: string[],
    gameMode: 'risk' | 'safe' = 'risk'
  ): boolean {
    // Check if already submitted for this round
    const key = `${playerName}-${roundIndex}`;
    if (this.submissions.has(key)) {
      return false; // Already submitted
    }

    const submission: Submission = {
      playerName,
      roundIndex,
      guessedSantaName: guessedSantas[0] || '', // Legacy field
      guessedSantas,
      gameMode,
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
      guessed_santas: sub.guessedSantas,
      game_mode: sub.gameMode,
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

  // Unlock poll (called when host clicks "One More Thing")
  unlockPoll(): void {
    this.roomState = {
      ...this.roomState,
      pollUnlocked: true,
    };
    this.notifyListeners();
  }

  // Set the actual Santa for a round
  setActualSanta(roundIndex: number, actualSantaName: string): void {
    this.actualSantas.set(roundIndex, actualSantaName);
  }

  // Get the actual Santa for a round
  getActualSanta(roundIndex: number): string | null {
    return this.actualSantas.get(roundIndex) ?? null;
  }

  // Get all actual Santas
  getAllActualSantas(): Record<number, string> {
    const result: Record<number, string> = {};
    this.actualSantas.forEach((santa, roundIndex) => {
      result[roundIndex] = santa;
    });
    return result;
  }

  // Poll: Submit vote for best gift sender
  submitPollVote(voterName: string, votedFor: string): boolean {
    console.log('mockStore.submitPollVote called:', { voterName, votedFor });
    if (this.pollVotes.has(voterName)) {
      console.log('Vote rejected: voter already voted');
      return false; // Already voted
    }
    this.pollVotes.set(voterName, votedFor);
    console.log('Vote submitted successfully. Total votes:', this.pollVotes.size);
    return true;
  }

  // Poll: Check if player has voted
  hasVoted(voterName: string): boolean {
    return this.pollVotes.has(voterName);
  }

  // Poll: Get all votes
  getAllPollVotes(): Array<{ voter_name: string; voted_for: string }> {
    const votes = Array.from(this.pollVotes.entries()).map(([voter, votedFor]) => ({
      voter_name: voter,
      voted_for: votedFor,
    }));
    console.log('📊 mockStore.getAllPollVotes() returning', votes.length, 'votes');
    return votes;
  }

  // Poll: Get vote counts
  getPollResults(): Record<string, number> {
    const results: Record<string, number> = {};
    this.pollVotes.forEach((votedFor) => {
      results[votedFor] = (results[votedFor] || 0) + 1;
    });
    return results;
  }

  // Sweater Poll: Unlock sweater poll (called when host clicks "One More Thing" after gift poll)
  unlockSweaterPoll(): void {
    this.roomState = {
      ...this.roomState,
      sweaterPollUnlocked: true,
    };
    this.notifyListeners();
  }

  // Sweater Poll: Submit vote for ugliest sweater
  submitSweaterVote(voterName: string, votedFor: string): boolean {
    console.log('mockStore.submitSweaterVote called:', { voterName, votedFor });
    if (this.sweaterVotes.has(voterName)) {
      console.log('Sweater vote rejected: voter already voted');
      return false; // Already voted
    }
    this.sweaterVotes.set(voterName, votedFor);
    console.log('Sweater vote submitted successfully. Total votes:', this.sweaterVotes.size);
    return true;
  }

  // Sweater Poll: Check if player has voted for sweater
  hasSweaterVoted(voterName: string): boolean {
    return this.sweaterVotes.has(voterName);
  }

  // Sweater Poll: Get all sweater votes
  getAllSweaterVotes(): Array<{ voter_name: string; voted_for: string }> {
    const votes = Array.from(this.sweaterVotes.entries()).map(([voter, votedFor]) => ({
      voter_name: voter,
      voted_for: votedFor,
    }));
    console.log('🎄 mockStore.getAllSweaterVotes() returning', votes.length, 'votes');
    return votes;
  }

  // Sweater Poll: Get vote counts
  getSweaterPollResults(): Record<string, number> {
    const results: Record<string, number> = {};
    this.sweaterVotes.forEach((votedFor) => {
      results[votedFor] = (results[votedFor] || 0) + 1;
    });
    return results;
  }

  // Reset the entire game (for testing)
  async reset(): Promise<void> {
    this.roomState = {
      openingOrder: [],
      currentIndex: 0,
      roundStartedAt: null,
      durationSec: 90,
      isStarted: false,
      resultsUnlocked: false,
      pollUnlocked: false,
      sweaterPollUnlocked: false,
    };
    this.activePlayers.clear();
    this.submissions.clear();
    this.actualSantas.clear();
    this.pollVotes.clear();
    this.sweaterVotes.clear();

    this.notifyListeners();
  }
}

// Singleton instance
export const mockStore = new MockStore();
