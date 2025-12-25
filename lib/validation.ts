// Input validation utilities

import {
  MIN_PLAYER_NAME_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  MIN_PLAYERS_TO_START,
} from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a player name
 * @param name - The player name to validate
 * @returns ValidationResult object with isValid flag and optional error message
 */
export function validatePlayerName(name: string): ValidationResult {
  // Check if name is provided
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'Player name is required',
    };
  }

  // Trim whitespace
  const trimmed = name.trim();

  // Check minimum length
  if (trimmed.length < MIN_PLAYER_NAME_LENGTH) {
    return {
      isValid: false,
      error: 'Player name is required',
    };
  }

  // Check maximum length
  if (trimmed.length > MAX_PLAYER_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Player name must be ${MAX_PLAYER_NAME_LENGTH} characters or less`,
    };
  }

  // Check for invalid characters (allow letters, numbers, spaces, hyphens, apostrophes)
  const validNamePattern = /^[a-zA-Z0-9\s'-]+$/;
  if (!validNamePattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Player name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Sanitizes a player name by trimming and removing extra whitespace
 * @param name - The player name to sanitize
 * @returns Sanitized player name
 */
export function sanitizePlayerName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Validates that a vote selection is valid
 * @param vote - The vote to validate
 * @param validOptions - Array of valid voting options
 * @returns ValidationResult object
 */
export function validateVote(vote: string, validOptions: string[]): ValidationResult {
  if (!vote || typeof vote !== 'string') {
    return {
      isValid: false,
      error: 'Please select a player',
    };
  }

  if (!validOptions.includes(vote)) {
    return {
      isValid: false,
      error: 'Invalid selection',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates that enough players have joined to start the game
 * @param playerCount - Number of active players
 * @returns ValidationResult object
 */
export function validateMinimumPlayers(playerCount: number): ValidationResult {
  if (playerCount < MIN_PLAYERS_TO_START) {
    return {
      isValid: false,
      error: `At least ${MIN_PLAYERS_TO_START} players are required to start the game`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates that a round index is within valid bounds
 * @param roundIndex - The round index to validate
 * @param maxRounds - Maximum number of rounds
 * @returns ValidationResult object
 */
export function validateRoundIndex(roundIndex: number, maxRounds: number): ValidationResult {
  if (typeof roundIndex !== 'number' || isNaN(roundIndex)) {
    return {
      isValid: false,
      error: 'Invalid round index',
    };
  }

  if (roundIndex < 0) {
    return {
      isValid: false,
      error: 'Round index cannot be negative',
    };
  }

  if (roundIndex >= maxRounds) {
    return {
      isValid: false,
      error: 'Round index exceeds maximum rounds',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates that a guess array is valid for the given game mode
 * @param guesses - Array of guessed names
 * @param gameMode - The game mode ('risk' or 'safe')
 * @param validPlayers - Array of valid player names
 * @returns ValidationResult object
 */
export function validateGuesses(
  guesses: string[],
  gameMode: 'risk' | 'safe',
  validPlayers: string[]
): ValidationResult {
  if (!Array.isArray(guesses)) {
    return {
      isValid: false,
      error: 'Invalid guesses format',
    };
  }

  const expectedLength = gameMode === 'risk' ? 1 : 3;

  if (guesses.length !== expectedLength) {
    return {
      isValid: false,
      error: `${gameMode === 'risk' ? 'Risk' : 'Safe'} mode requires exactly ${expectedLength} guess${expectedLength > 1 ? 'es' : ''}`,
    };
  }

  // Check all guesses are valid players
  for (const guess of guesses) {
    if (!validPlayers.includes(guess)) {
      return {
        isValid: false,
        error: `Invalid player selection: ${guess}`,
      };
    }
  }

  // Check for duplicates in safe mode
  if (gameMode === 'safe') {
    const uniqueGuesses = new Set(guesses);
    if (uniqueGuesses.size !== guesses.length) {
      return {
        isValid: false,
        error: 'Cannot select the same player multiple times',
      };
    }
  }

  return {
    isValid: true,
  };
}

/**
 * Type guard to check if a value is an HTMLInputElement
 * @param element - The element to check
 * @returns True if element is HTMLInputElement
 */
export function isHTMLInputElement(element: Element | null): element is HTMLInputElement {
  return element !== null && element instanceof HTMLInputElement;
}

/**
 * Type guard to check if a value is an HTMLFormElement
 * @param element - The element to check
 * @returns True if element is HTMLFormElement
 */
export function isHTMLFormElement(element: EventTarget | null): element is HTMLFormElement {
  return element !== null && element instanceof HTMLFormElement;
}
