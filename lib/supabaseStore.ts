'use client';

// Supabase-powered store that replaces mockStore
// Uses Supabase Realtime for live updates

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, hasValidCredentials } from './supabase';
import { RoomState, RoomStateListener } from './types';

// All 16 player names
export const ALL_PLAYERS = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Karen',
  'Leo',
  'Mia',
  'Noah',
  'Olivia',
  'Peter',
];

// Default room ID - in production, you might generate this per session
const DEFAULT_ROOM_ID = '00000000-0000-0000-0000-000000000001';

class SupabaseStore {
  private roomId: string = DEFAULT_ROOM_ID;
  private listeners: Set<RoomStateListener> = new Set();
  private realtimeChannel: RealtimeChannel | null = null;
  private currentState: RoomState | null = null;

  constructor() {
    this.initializeRoom();
    this.setupRealtimeSubscription();
  }

  // Initialize the room if it doesn't exist
  private async initializeRoom(): Promise<void> {
    if (!supabase) return;

    try {
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', this.roomId)
        .single();

      if (!existingRoom) {
        // Create default room
        await supabase.from('rooms').insert({
          id: this.roomId,
          opening_order: [],
          current_index: 0,
          round_started_at: null,
          duration_sec: 90,
          is_started: false,
        });
      }

      // Load initial state
      await this.fetchRoomState();
    } catch (error) {
      console.error('Error initializing room:', error);
    }
  }

  // Fetch current room state from database
  private async fetchRoomState(): Promise<void> {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', this.roomId)
        .single();

      if (error) throw error;

      if (data) {
        this.currentState = {
          openingOrder: data.opening_order || [],
          currentIndex: data.current_index || 0,
          roundStartedAt: data.round_started_at
            ? new Date(data.round_started_at).getTime()
            : null,
          durationSec: data.duration_sec || 90,
          isStarted: data.is_started || false,
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error fetching room state:', error);
    }
  }

  // Setup Supabase Realtime subscription
  private setupRealtimeSubscription(): void {
    if (!supabase) return;

    this.realtimeChannel = supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${this.roomId}`,
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            this.currentState = {
              openingOrder: data.opening_order || [],
              currentIndex: data.current_index || 0,
              roundStartedAt: data.round_started_at
                ? new Date(data.round_started_at).getTime()
                : null,
              durationSec: data.duration_sec || 90,
              isStarted: data.is_started || false,
            };
            this.notifyListeners();
          }
        }
      )
      .subscribe();
  }

  // Subscribe to room state changes
  subscribe(listener: RoomStateListener): () => void {
    this.listeners.add(listener);

    // Immediately call with current state if available
    if (this.currentState) {
      listener(this.currentState);
    } else {
      // Fetch and notify
      this.fetchRoomState();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    if (this.currentState) {
      this.listeners.forEach((listener) => listener(this.currentState!));
    }
  }

  // Get current room state
  getRoomState(): RoomState {
    return (
      this.currentState || {
        openingOrder: [],
        currentIndex: 0,
        roundStartedAt: null,
        durationSec: 90,
        isStarted: false,
      }
    );
  }

  // Host: Start the game with randomized order
  async startGame(): Promise<void> {
    if (!supabase) return;

    try {
      const shuffled = [...ALL_PLAYERS].sort(() => Math.random() - 0.5);

      // Use server-side function to ensure timestamp sync across all clients
      const { data, error } = await supabase.rpc('start_game_with_server_time', {
        p_room_id: this.roomId,
        p_opening_order: shuffled,
      });

      if (error) {
        // Fallback to client-side if function doesn't exist yet
        console.warn('Using fallback method:', error);
        await supabase
          .from('rooms')
          .update({
            opening_order: shuffled,
            current_index: 0,
            round_started_at: new Date().toISOString(),
            is_started: true,
          })
          .eq('id', this.roomId);
      }

      // Fetch updated state to ensure we have the server timestamp
      await this.fetchRoomState();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  }

  // Host: Advance to next recipient
  async nextRecipient(): Promise<void> {
    if (!supabase) return;

    try {
      const state = this.getRoomState();
      if (!state.isStarted) return;
      if (state.currentIndex >= state.openingOrder.length - 1) return;

      // Use server-side function to ensure timestamp sync across all clients
      const { data, error } = await supabase.rpc('next_round_with_server_time', {
        p_room_id: this.roomId,
      });

      if (error) {
        // Fallback to client-side if function doesn't exist yet
        console.warn('Using fallback method:', error);
        await supabase
          .from('rooms')
          .update({
            current_index: state.currentIndex + 1,
            round_started_at: new Date().toISOString(),
          })
          .eq('id', this.roomId);
      }

      // Fetch updated state to ensure we have the server timestamp
      await this.fetchRoomState();
    } catch (error) {
      console.error('Error advancing to next recipient:', error);
    }
  }

  // Host: Update timer duration
  async setTimerDuration(seconds: number): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('rooms')
        .update({ duration_sec: seconds })
        .eq('id', this.roomId);
    } catch (error) {
      console.error('Error setting timer duration:', error);
    }
  }

  // Player: Submit a guess for current round
  async submitGuess(
    playerName: string,
    roundIndex: number,
    guessedSantaName: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('submissions').insert({
        room_id: this.roomId,
        player_name: playerName,
        round_index: roundIndex,
        guessed_santa_name: guessedSantaName,
      });

      if (error) {
        // Check if it's a unique constraint violation (already submitted)
        if (error.code === '23505') {
          return false;
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error submitting guess:', error);
      return false;
    }
  }

  // Player: Check if already submitted for a round
  async hasSubmitted(playerName: string, roundIndex: number): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id')
        .eq('room_id', this.roomId)
        .eq('player_name', playerName)
        .eq('round_index', roundIndex)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking submission:', error);
      return false;
    }
  }

  // Get current recipient name
  getCurrentRecipient(): string | null {
    const state = this.getRoomState();
    if (!state.isStarted || state.openingOrder.length === 0) {
      return null;
    }
    return state.openingOrder[state.currentIndex] ?? null;
  }

  // Reset the entire game
  async reset(): Promise<void> {
    if (!supabase) return;

    try {
      // Reset room state
      await supabase
        .from('rooms')
        .update({
          opening_order: [],
          current_index: 0,
          round_started_at: null,
          is_started: false,
        })
        .eq('id', this.roomId);

      // Delete all submissions for this room
      await supabase.from('submissions').delete().eq('room_id', this.roomId);
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  }

  // Cleanup
  disconnect(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }
}

// Singleton instance
export const supabaseStore = new SupabaseStore();
