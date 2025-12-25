import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '../mockStore';

describe('Game Modes', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('Risk Mode', () => {
    it('should accept single guess in risk mode', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      const success = mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      expect(success).toBe(true);
    });

    it('should prevent duplicate submissions in risk mode', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      const duplicate = mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');

      expect(duplicate).toBe(false);
    });

    it('should store risk mode correctly', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      const submissions = mockStore.getAllSubmissions();

      expect(submissions[0].guessed_santas).toEqual(['Bob']);
      expect(submissions[0].game_mode).toBe('risk');
    });
  });

  describe('Safe Mode', () => {
    it('should accept multiple guesses in safe mode', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.registerPlayer('Charlie');
      mockStore.startGame();

      const success = mockStore.submitGuess(
        'Alice',
        0,
        ['Bob', 'Charlie'],
        'safe'
      );

      expect(success).toBe(true);
    });

    it('should store all guesses in safe mode', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.registerPlayer('Charlie');
      mockStore.startGame();

      mockStore.submitGuess('Alice', 0, ['Bob', 'Charlie'], 'safe');
      const submissions = mockStore.getAllSubmissions();

      expect(submissions[0].guessed_santas).toEqual(['Bob', 'Charlie']);
      expect(submissions[0].game_mode).toBe('safe');
    });

    it('should accept up to 3 guesses in safe mode', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.registerPlayer('Charlie');
      mockStore.registerPlayer('Dave');
      mockStore.startGame();

      const success = mockStore.submitGuess(
        'Alice',
        0,
        ['Bob', 'Charlie', 'Dave'],
        'safe'
      );

      expect(success).toBe(true);

      const submissions = mockStore.getAllSubmissions();
      expect(submissions[0].guessed_santas).toHaveLength(3);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should maintain guessed_santa_name for backward compatibility', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      const submissions = mockStore.getAllSubmissions();

      expect(submissions[0].guessed_santa_name).toBe('Bob');
    });

    it('should handle empty guesses array gracefully', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.submitGuess('Alice', 0, [], 'risk');
      const submissions = mockStore.getAllSubmissions();

      expect(submissions[0].guessed_santa_name).toBe('');
      expect(submissions[0].guessed_santas).toEqual([]);
    });
  });

  describe('Multiple Rounds with Game Modes', () => {
    it('should track different game modes across rounds', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      // Round 0: Alice uses risk mode
      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');

      // Round 1: Bob uses safe mode
      mockStore.nextRecipient();
      mockStore.submitGuess('Bob', 1, ['Alice'], 'safe');

      const submissions = mockStore.getAllSubmissions();
      expect(submissions).toHaveLength(2);
      expect(submissions[0].game_mode).toBe('risk');
      expect(submissions[1].game_mode).toBe('safe');
    });

    it('should allow same player to use different modes in different rounds', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.registerPlayer('Charlie');
      mockStore.startGame();

      // Round 0: Alice uses risk mode
      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');

      // Round 1: Alice uses safe mode
      mockStore.nextRecipient();
      mockStore.submitGuess('Alice', 1, ['Bob', 'Charlie'], 'safe');

      const submissions = mockStore.getAllSubmissions();
      const aliceSubmissions = submissions.filter(s => s.player_name === 'Alice');

      expect(aliceSubmissions).toHaveLength(2);
      expect(aliceSubmissions[0].game_mode).toBe('risk');
      expect(aliceSubmissions[1].game_mode).toBe('safe');
    });
  });

  describe('Actual Santa and Game Modes', () => {
    it('should store and retrieve actual Santa for a round', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.setActualSanta(0, 'Bob');
      const actualSanta = mockStore.getActualSanta(0);

      expect(actualSanta).toBe('Bob');
    });

    it('should get all actual Santas', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.setActualSanta(0, 'Bob');
      mockStore.setActualSanta(1, 'Alice');

      const allSantas = mockStore.getAllActualSantas();
      expect(allSantas).toEqual({
        0: 'Bob',
        1: 'Alice',
      });
    });

    it('should return null for unset actual Santa', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      const actualSanta = mockStore.getActualSanta(0);
      expect(actualSanta).toBeNull();
    });
  });

  describe('Reset with Game Modes', () => {
    it('should clear all submissions and actual Santas on reset', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      mockStore.setActualSanta(0, 'Bob');

      mockStore.reset();

      const submissions = mockStore.getAllSubmissions();
      const actualSantas = mockStore.getAllActualSantas();

      expect(submissions).toHaveLength(0);
      expect(actualSantas).toEqual({});
    });
  });
});
