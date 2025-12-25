import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '../mockStore';

describe('MockStore', () => {
  beforeEach(() => {
    // Reset store before each test
    mockStore.reset();
  });

  describe('registerPlayer', () => {
    it('should register a new player', async () => {
      mockStore.registerPlayer('Alice');
      const players = mockStore.getActivePlayers();
      expect(players).toContain('Alice');
    });

    it('should not duplicate players', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Alice');
      const players = mockStore.getActivePlayers();
      expect(players.filter((p) => p === 'Alice')).toHaveLength(1);
    });
  });

  describe('startGame', () => {
    it('should start game with registered players', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      const state = mockStore.getRoomState();
      expect(state.isStarted).toBe(true);
      expect(state.openingOrder).toHaveLength(2);
      expect(state.openingOrder).toContain('Alice');
      expect(state.openingOrder).toContain('Bob');
    });

    it('should randomize player order', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.registerPlayer('Charlie');

      const orders = new Set();
      // Run multiple times to check randomization
      for (let i = 0; i < 10; i++) {
        mockStore.reset();
        mockStore.registerPlayer('Alice');
        mockStore.registerPlayer('Bob');
        mockStore.registerPlayer('Charlie');
        mockStore.startGame();
        orders.add(mockStore.getRoomState().openingOrder.join(','));
      }

      // Should have at least 2 different orders
      expect(orders.size).toBeGreaterThan(1);
    });
  });

  describe('submitGuess', () => {
    it('should allow submitting a guess', () => {
      const success = mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      expect(success).toBe(true);
    });

    it('should prevent duplicate submissions', () => {
      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      const success = mockStore.submitGuess('Alice', 0, ['Charlie'], 'risk');
      expect(success).toBe(false);
    });

    it('should track submissions correctly', () => {
      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      const hasSubmitted = mockStore.hasSubmitted('Alice', 0);
      expect(hasSubmitted).toBe(true);
    });
  });

  describe('nextRecipient', () => {
    it('should advance to next recipient', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      expect(mockStore.getRoomState().currentIndex).toBe(0);
      mockStore.nextRecipient();
      expect(mockStore.getRoomState().currentIndex).toBe(1);
    });

    it('should not advance past last recipient', () => {
      mockStore.registerPlayer('Alice');
      mockStore.registerPlayer('Bob');
      mockStore.startGame();

      mockStore.nextRecipient();
      mockStore.nextRecipient();
      expect(mockStore.getRoomState().currentIndex).toBe(1);
    });
  });

  describe('actualSanta', () => {
    it('should set and get actual Santa', () => {
      mockStore.setActualSanta(0, 'Bob');
      expect(mockStore.getActualSanta(0)).toBe('Bob');
    });

    it('should return null for unset rounds', () => {
      expect(mockStore.getActualSanta(5)).toBeNull();
    });

    it('should get all actual Santas', () => {
      mockStore.setActualSanta(0, 'Alice');
      mockStore.setActualSanta(1, 'Bob');

      const santas = mockStore.getAllActualSantas();
      expect(santas[0]).toBe('Alice');
      expect(santas[1]).toBe('Bob');
    });
  });

  describe('reset', () => {
    it('should clear all game data', () => {
      mockStore.registerPlayer('Alice');
      mockStore.startGame();
      mockStore.submitGuess('Alice', 0, ['Bob'], 'risk');
      mockStore.setActualSanta(0, 'Bob');

      mockStore.reset();

      const state = mockStore.getRoomState();
      expect(state.isStarted).toBe(false);
      expect(state.openingOrder).toHaveLength(0);
      expect(mockStore.getActivePlayers()).toHaveLength(0);
      expect(mockStore.getAllSubmissions()).toHaveLength(0);
      expect(mockStore.getActualSanta(0)).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should notify listeners of state changes', () => {
      let notificationCount = 0;
      const unsubscribe = mockStore.subscribe(() => {
        notificationCount++;
      });

      mockStore.registerPlayer('Alice');
      // subscribe itself triggers once with initial state
      // startGame triggers another notification
      mockStore.startGame();

      expect(notificationCount).toBeGreaterThan(0);
      unsubscribe();
    });
  });
});
