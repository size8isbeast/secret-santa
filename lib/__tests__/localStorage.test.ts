import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorage } from '../localStorage';

describe('LocalStorage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('savePlayerName', () => {
    it('should save player name to localStorage', () => {
      LocalStorage.savePlayerName('Alice');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'secret-santa-playerName',
        'Alice'
      );
    });
  });

  describe('getPlayerName', () => {
    it('should retrieve player name from localStorage', () => {
      localStorage.getItem = vi.fn().mockReturnValue('Alice');
      const name = LocalStorage.getPlayerName();
      expect(name).toBe('Alice');
    });

    it('should return null if no player name stored', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);
      const name = LocalStorage.getPlayerName();
      expect(name).toBeNull();
    });
  });

  describe('clearPlayerName', () => {
    it('should remove player name from localStorage', () => {
      LocalStorage.clearPlayerName();
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'secret-santa-playerName'
      );
    });
  });

  describe('saveLastViewedRound', () => {
    it('should save last viewed round', () => {
      LocalStorage.saveLastViewedRound(5);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'secret-santa-lastViewedRound',
        '5'
      );
    });
  });

  describe('getLastViewedRound', () => {
    it('should retrieve last viewed round as number', () => {
      localStorage.getItem = vi.fn().mockReturnValue('3');
      const round = LocalStorage.getLastViewedRound();
      expect(round).toBe(3);
    });

    it('should return null if no round stored', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);
      const round = LocalStorage.getLastViewedRound();
      expect(round).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all secret-santa items from localStorage', () => {
      // Mock keys with both secret-santa and other items
      Object.defineProperty(global, 'localStorage', {
        value: {
          ...localStorage,
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      const mockKeys = vi.fn().mockReturnValue([
        'secret-santa-playerName',
        'secret-santa-lastViewedRound',
        'other-app-data',
      ]);

      Object.keys = mockKeys;

      LocalStorage.clearAll();

      // Should only remove secret-santa prefixed items
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'secret-santa-playerName'
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'secret-santa-lastViewedRound'
      );
    });
  });
});
