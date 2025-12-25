// Utility for managing localStorage with type safety and SSR compatibility

const STORAGE_PREFIX = 'secret-santa-';

export const LocalStorage = {
  // Save player name
  savePlayerName(name: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}playerName`, name);
    } catch (error) {
      console.warn('Failed to save player name to localStorage:', error);
    }
  },

  // Get saved player name
  getPlayerName(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}playerName`);
    } catch (error) {
      console.warn('Failed to get player name from localStorage:', error);
      return null;
    }
  },

  // Clear player name
  clearPlayerName(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}playerName`);
    } catch (error) {
      console.warn('Failed to clear player name from localStorage:', error);
    }
  },

  // Save last viewed results
  saveLastViewedRound(roundIndex: number): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}lastViewedRound`, roundIndex.toString());
    } catch (error) {
      console.warn('Failed to save last viewed round:', error);
    }
  },

  // Get last viewed round
  getLastViewedRound(): number | null {
    if (typeof window === 'undefined') return null;
    try {
      const value = localStorage.getItem(`${STORAGE_PREFIX}lastViewedRound`);
      if (!value) return null;

      const parsed = parseInt(value, 10);
      // Validate that parsed value is a valid number
      if (isNaN(parsed) || parsed < 0) {
        console.warn('Invalid round index in localStorage:', value);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to get last viewed round:', error);
      return null;
    }
  },

  // Clear all game data
  clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },
};
