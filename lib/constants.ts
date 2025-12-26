// Application-wide constants

// Room Configuration
export const DEFAULT_ROOM_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_TIMER_DURATION_SEC = 180;

// Polling Intervals (milliseconds)
export const VOTE_POLLING_INTERVAL_MS = 2000;
export const ACTIVE_PLAYERS_POLLING_INTERVAL_MS = 2000;
export const TIMER_UPDATE_INTERVAL_MS = 100;

// Input Validation
export const MIN_PLAYER_NAME_LENGTH = 1;
export const MAX_PLAYER_NAME_LENGTH = 30;
export const MIN_PLAYERS_TO_START = 2;

// Game Modes
export const GAME_MODE_RISK = 'risk' as const;
export const GAME_MODE_SAFE = 'safe' as const;

// Scoring
export const RISK_MODE_POINTS = 3;
export const SAFE_MODE_POINTS = 1;
export const RISK_MODE_GUESSES = 1;
export const SAFE_MODE_GUESSES = 3;

// Timer Thresholds
export const LOW_TIME_THRESHOLD_SEC = 10;

// LocalStorage Keys
export const STORAGE_PREFIX = 'secret-santa-';
export const STORAGE_KEY_PLAYER_NAME = `${STORAGE_PREFIX}playerName`;
export const STORAGE_KEY_LAST_VIEWED_ROUND = `${STORAGE_PREFIX}lastViewedRound`;

// Animation Durations (for final celebration screen)
export const SNOWFLAKE_COUNT = 50;
export const SNOWFLAKE_MIN_DURATION_SEC = 5;
export const SNOWFLAKE_MAX_DURATION_SEC = 15;
