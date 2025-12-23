'use client';

// Unified store that switches between mock and Supabase based on environment
// If Supabase credentials are provided, use Supabase, otherwise use mock

import { mockStore, ALL_PLAYERS as mockPlayers } from './mockStore';
import { supabaseStore, ALL_PLAYERS as supabasePlayers } from './supabaseStore';
import { hasValidCredentials } from './supabase';

// Export the appropriate store based on configuration
export const store = hasValidCredentials ? supabaseStore : mockStore;

// Export ALL_PLAYERS (same in both stores)
export const ALL_PLAYERS: string[] = hasValidCredentials ? supabasePlayers : mockPlayers;

// Log which store is being used
if (typeof window !== 'undefined') {
  console.log(
    `🎅 Using ${hasValidCredentials ? 'Supabase' : 'Mock'} store for Secret Santa`
  );
}
