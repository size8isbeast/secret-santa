'use client';

// Supabase-powered store that replaces mockStore
// Uses Supabase Realtime for live updates

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, hasValidCredentials } from './supabase';
import { RoomState, RoomStateListener } from './types';

// Player names (2 for testing, can be expanded to 16)
export const ALL_PLAYERS = [
  'Alice',
  'Bob',
];

// Default room ID - in production, you might generate this per session
const DEFAULT_ROOM_ID = '00000000-0000-0000-0000-000000000001';

class SupabaseStore {
  private roomId: string = DEFAULT_ROOM_ID;
  private listeners: Set<RoomStateListener> = new Set();
  private realtimeChannel: RealtimeChannel | null = null;
  private currentState: RoomState | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      console.log('🎅 SupabaseStore initialized in browser');
    }
    this.initializeRoom();
    this.setupRealtimeSubscription();
    this.setupPollingFallback();
  }

  // Initialize the room if it doesn't exist
  private async initializeRoom(): Promise<void> {
    if (!supabase) {
      console.warn('⚠️ Supabase client not available');
      return;
    }

    console.log('🔧 Initializing room:', this.roomId);

    try {
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', this.roomId)
        .single();

      if (!existingRoom) {
        console.log('📝 Creating new room');
        // Create default room
        await supabase.from('rooms').insert({
          id: this.roomId,
          opening_order: [],
          current_index: 0,
          round_started_at: null,
          duration_sec: 90,
          is_started: false,
        });
      } else {
        console.log('✅ Room exists:', existingRoom);
      }

      // Load initial state
      await this.fetchRoomState();
    } catch (error) {
      console.error('❌ Error initializing room:', error);
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
          console.log('🔴 Realtime update received:', payload);
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
            console.log('🟢 State updated:', this.currentState);
            this.notifyListeners();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });
  }

  // Setup polling as fallback for realtime
  private setupPollingFallback(): void {
    if (typeof window === 'undefined') return; // Only in browser

    // Poll every 2 seconds as fallback
    this.pollingInterval = setInterval(() => {
      this.fetchRoomState();
    }, 2000);
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
      console.log('🎮 Starting game with order:', shuffled);

      // Use server-side function to ensure timestamp sync across all clients
      const { data, error } = await supabase.rpc('start_game_with_server_time', {
        p_room_id: this.roomId,
        p_opening_order: shuffled,
      });

      if (error) {
        // Fallback to client-side if function doesn't exist yet
        console.warn('⚠️ Using fallback method:', error);
        const { error: updateError } = await supabase
          .from('rooms')
          .update({
            opening_order: shuffled,
            current_index: 0,
            round_started_at: new Date().toISOString(),
            is_started: true,
          })
          .eq('id', this.roomId);

        if (updateError) {
          console.error('❌ Update failed:', updateError);
        } else {
          console.log('✅ Fallback update successful');
        }
      } else {
        console.log('✅ Server-side function executed:', data);
      }

      // Fetch updated state to ensure we have the server timestamp
      await this.fetchRoomState();
    } catch (error) {
      console.error('❌ Error starting game:', error);
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

  // Get all submissions for the current room
  async getAllSubmissions(): Promise<any[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('room_id', this.roomId)
        .order('round_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
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
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}

// Singleton instance
export const supabaseStore = new SupabaseStore();
