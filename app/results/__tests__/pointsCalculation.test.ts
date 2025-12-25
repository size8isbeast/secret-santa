import { describe, it, expect } from 'vitest';

interface Submission {
  player_name: string;
  round_index: number;
  guessed_santa_name: string;
  guessed_santas?: string[];
  game_mode?: 'risk' | 'safe';
}

interface RoomState {
  openingOrder: string[];
  currentIndex: number;
  roundStartedAt: number | null;
  durationSec: number;
  isStarted: boolean;
  resultsUnlocked: boolean;
}

// This is the same logic as in the results page
function calculatePoints(
  submissions: Submission[],
  actualSantas: Record<number, string>,
  openingOrder: string[]
): Record<string, number> {
  const points: Record<string, number> = {};

  // Initialize all players with 0 points
  openingOrder.forEach((player) => {
    points[player] = 0;
  });

  // Award points for correct guesses
  submissions.forEach((sub) => {
    const actualSanta = actualSantas[sub.round_index];
    if (!actualSanta) return;

    const gameMode = sub.game_mode || 'risk';
    const guesses = sub.guessed_santas || [sub.guessed_santa_name];

    // Check if any of the guesses match the actual Santa
    const isCorrect = guesses.includes(actualSanta);

    if (isCorrect) {
      // Check if this player was the recipient for this round
      const recipient = openingOrder[sub.round_index];
      const isRecipient = sub.player_name === recipient;

      let pointsToAdd = 1; // Default for other players

      if (isRecipient) {
        // Recipient used game modes: Risk = 3 points, Safe = 1 point
        pointsToAdd = gameMode === 'risk' ? 3 : 1;
      }

      points[sub.player_name] = (points[sub.player_name] || 0) + pointsToAdd;
    }
  });

  return points;
}

describe('Points Calculation with Game Modes', () => {
  describe('Recipient Points (Game Modes)', () => {
    it('should award 3 points for correct risk mode guess by recipient', () => {
      const openingOrder = ['Alice', 'Bob'];
      const submissions: Submission[] = [
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk',
        },
      ];
      const actualSantas = { 0: 'Bob' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(3);
    });

    it('should award 1 point for correct safe mode guess by recipient', () => {
      const openingOrder = ['Alice', 'Bob', 'Charlie'];
      const submissions: Submission[] = [
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob', 'Charlie'],
          game_mode: 'safe',
        },
      ];
      const actualSantas = { 0: 'Bob' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(1);
    });

    it('should award 1 point even if only one of 3 safe mode guesses is correct', () => {
      const openingOrder = ['Alice', 'Bob', 'Charlie', 'Dave'];
      const submissions: Submission[] = [
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob', 'Charlie', 'Dave'],
          game_mode: 'safe',
        },
      ];
      const actualSantas = { 0: 'Dave' }; // Only Dave is correct

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(1);
    });

    it('should award 0 points for incorrect risk mode guess by recipient', () => {
      const openingOrder = ['Alice', 'Bob', 'Charlie'];
      const submissions: Submission[] = [
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk',
        },
      ];
      const actualSantas = { 0: 'Charlie' }; // Wrong guess

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(0);
    });
  });

  describe('Non-Recipient Points (Regular Mode)', () => {
    it('should award 1 point for correct guess by non-recipient', () => {
      const openingOrder = ['Alice', 'Bob'];
      const submissions: Submission[] = [
        {
          player_name: 'Bob', // Bob is guessing about Alice's Santa
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk', // Non-recipients always get 1 point
        },
      ];
      const actualSantas = { 0: 'Bob' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Bob']).toBe(1);
    });

    it('should award 0 points for incorrect guess by non-recipient', () => {
      const openingOrder = ['Alice', 'Bob', 'Charlie'];
      const submissions: Submission[] = [
        {
          player_name: 'Bob',
          round_index: 0,
          guessed_santa_name: 'Charlie',
          guessed_santas: ['Charlie'],
          game_mode: 'risk',
        },
      ];
      const actualSantas = { 0: 'Bob' }; // Wrong guess

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Bob']).toBe(0);
    });
  });

  describe('Mixed Scenarios', () => {
    it('should correctly calculate points for multiple rounds with different modes', () => {
      const openingOrder = ['Alice', 'Bob', 'Charlie'];
      const submissions: Submission[] = [
        // Round 0: Alice is recipient, uses risk mode, correct
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk',
        },
        // Round 0: Bob is not recipient, regular mode, correct
        {
          player_name: 'Bob',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk',
        },
        // Round 1: Bob is recipient, uses safe mode, correct
        {
          player_name: 'Bob',
          round_index: 1,
          guessed_santa_name: 'Alice',
          guessed_santas: ['Alice', 'Charlie'],
          game_mode: 'safe',
        },
        // Round 1: Alice is not recipient, regular mode, wrong
        {
          player_name: 'Alice',
          round_index: 1,
          guessed_santa_name: 'Charlie',
          guessed_santas: ['Charlie'],
          game_mode: 'risk',
        },
      ];
      const actualSantas = { 0: 'Bob', 1: 'Alice' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(3); // Round 0: 3 points (risk), Round 1: 0 (wrong)
      expect(points['Bob']).toBe(2); // Round 0: 1 point (regular), Round 1: 1 (safe)
      expect(points['Charlie']).toBe(0); // No submissions
    });

    it('should handle missing actual Santa gracefully', () => {
      const openingOrder = ['Alice', 'Bob'];
      const submissions: Submission[] = [
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk',
        },
      ];
      const actualSantas = {}; // No actual Santa set

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(0);
    });

    it('should award correct points when recipient uses safe mode and gets it right', () => {
      const openingOrder = ['Alice', 'Bob', 'Charlie', 'Dave'];
      const submissions: Submission[] = [
        // Alice is recipient, uses safe mode with 3 guesses
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob', 'Charlie', 'Dave'],
          game_mode: 'safe',
        },
        // Bob is not recipient, regular mode
        {
          player_name: 'Bob',
          round_index: 0,
          guessed_santa_name: 'Charlie',
          guessed_santas: ['Charlie'],
          game_mode: 'risk',
        },
      ];
      const actualSantas = { 0: 'Charlie' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(1); // Safe mode: 1 point
      expect(points['Bob']).toBe(1); // Regular mode: 1 point
    });

    it('should differentiate between recipient and non-recipient in same round', () => {
      const openingOrder = ['Alice', 'Bob', 'Charlie'];
      const submissions: Submission[] = [
        // Alice is recipient, uses risk mode
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk',
        },
        // Bob is not recipient, regular mode, same guess
        {
          player_name: 'Bob',
          round_index: 0,
          guessed_santa_name: 'Bob',
          guessed_santas: ['Bob'],
          game_mode: 'risk',
        },
      ];
      const actualSantas = { 0: 'Bob' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(3); // Recipient with risk mode
      expect(points['Bob']).toBe(1); // Non-recipient regular mode
    });
  });

  describe('Legacy Compatibility', () => {
    it('should work with old submissions missing game_mode field', () => {
      const openingOrder = ['Alice', 'Bob'];
      const submissions: Submission[] = [
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          // No game_mode field
        },
      ];
      const actualSantas = { 0: 'Bob' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(3); // Defaults to risk mode
    });

    it('should work with old submissions missing guessed_santas field', () => {
      const openingOrder = ['Alice', 'Bob'];
      const submissions: Submission[] = [
        {
          player_name: 'Alice',
          round_index: 0,
          guessed_santa_name: 'Bob',
          game_mode: 'risk',
          // No guessed_santas field
        },
      ];
      const actualSantas = { 0: 'Bob' };

      const points = calculatePoints(submissions, actualSantas, openingOrder);

      expect(points['Alice']).toBe(3); // Uses guessed_santa_name
    });
  });
});
