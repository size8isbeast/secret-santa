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
          resultsUnlocked: data.results_unlocked || false,
          pollUnlocked: data.poll_unlocked || false,
          sweaterPollUnlocked: data.sweater_poll_unlocked || false,
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
              resultsUnlocked: data.results_unlocked || false,
              pollUnlocked: data.poll_unlocked || false,
              sweaterPollUnlocked: data.sweater_poll_unlocked || false,
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
        resultsUnlocked: false,
        pollUnlocked: false,
        sweaterPollUnlocked: false,
      }
    );
  }

  // Player: Register as active player
  async registerPlayer(playerName: string): Promise<void> {
    if (!supabase) return;

    try {
      // Get current active players
      const { data: room } = await supabase
        .from('rooms')
        .select('active_players')
        .eq('id', this.roomId)
        .single();

      const activePlayers = room?.active_players || [];

      // Add player if not already in the list
      if (!activePlayers.includes(playerName)) {
        await supabase
          .from('rooms')
          .update({
            active_players: [...activePlayers, playerName],
          })
          .eq('id', this.roomId);
      }
    } catch (error) {
      console.error('Error registering player:', error);
    }
  }

  // Host: Start the game with randomized order
  async startGame(): Promise<void> {
    if (!supabase) return;

    try {
      // Get active players who have entered
      const { data: room } = await supabase
        .from('rooms')
        .select('active_players')
        .eq('id', this.roomId)
        .single();

      const activePlayers = room?.active_players || [];

      // Use active players if any, otherwise fall back to ALL_PLAYERS
      const playersToUse = activePlayers.length > 0 ? activePlayers : ALL_PLAYERS;
      const shuffled = [...playersToUse].sort(() => Math.random() - 0.5);
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
    guessedSantas: string[],
    gameMode: 'risk' | 'safe' = 'risk'
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('submissions').insert({
        room_id: this.roomId,
        player_name: playerName,
        round_index: roundIndex,
        guessed_santa_name: guessedSantas[0] || '', // Legacy field
        guessed_santas: guessedSantas,
        game_mode: gameMode,
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

  // Get active players who have entered
  async getActivePlayers(): Promise<string[]> {
    if (!supabase) return [];

    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('active_players')
        .eq('id', this.roomId)
        .single();

      return room?.active_players || [];
    } catch (error) {
      console.error('Error fetching active players:', error);
      return [];
    }
  }

  // Unlock results (called when host visits results page)
  async unlockResults(): Promise<void> {
    if (!supabase) return;

    try {
      const { error } = await supabase.rpc('unlock_results', {
        p_room_id: this.roomId,
      });

      if (error) {
        // Fallback to direct update if function doesn't exist
        console.warn('Using fallback method:', error);
        await supabase
          .from('rooms')
          .update({ results_unlocked: true })
          .eq('id', this.roomId);
      }

      // Fetch updated state
      await this.fetchRoomState();
    } catch (error) {
      console.error('Error unlocking results:', error);
    }
  }

  // Unlock poll (called when host clicks "One More Thing")
  async unlockPoll(): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('rooms')
        .update({ poll_unlocked: true })
        .eq('id', this.roomId);

      // Fetch updated state
      await this.fetchRoomState();
    } catch (error) {
      console.error('Error unlocking poll:', error);
    }
  }

  // Set the actual Santa for a round
  async setActualSanta(roundIndex: number, actualSantaName: string): Promise<void> {
    if (!supabase) return;

    try {
      // Upsert (insert or update if exists)
      await supabase
        .from('actual_santas')
        .upsert({
          room_id: this.roomId,
          round_index: roundIndex,
          actual_santa_name: actualSantaName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'room_id,round_index'
        });
    } catch (error) {
      console.error('Error setting actual Santa:', error);
    }
  }

  // Get the actual Santa for a round
  async getActualSanta(roundIndex: number): Promise<string | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('actual_santas')
        .select('actual_santa_name')
        .eq('room_id', this.roomId)
        .eq('round_index', roundIndex)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      return data?.actual_santa_name ?? null;
    } catch (error) {
      console.error('Error getting actual Santa:', error);
      return null;
    }
  }

  // Get all actual Santas
  async getAllActualSantas(): Promise<Record<number, string>> {
    if (!supabase) return {};

    try {
      const { data, error } = await supabase
        .from('actual_santas')
        .select('round_index, actual_santa_name')
        .eq('room_id', this.roomId)
        .order('round_index', { ascending: true });

      if (error) throw error;

      const result: Record<number, string> = {};
      data?.forEach((row) => {
        result[row.round_index] = row.actual_santa_name;
      });

      return result;
    } catch (error) {
      console.error('Error getting all actual Santas:', error);
      return {};
    }
  }

  // Poll: Submit vote for best gift sender
  async submitPollVote(voterName: string, votedFor: string): Promise<boolean> {
    if (!supabase) {
      console.error('supabaseStore.submitPollVote: Supabase client not available');
      return false;
    }

    console.log('supabaseStore.submitPollVote called:', { voterName, votedFor, roomId: this.roomId });

    try {
      const { error } = await supabase.from('poll_votes').insert({
        room_id: this.roomId,
        voter_name: voterName,
        voted_for: votedFor,
      });

      if (error) {
        // Check if it's a unique constraint violation (already voted)
        if (error.code === '23505') {
          console.log('Vote rejected: voter already voted (unique constraint)');
          return false;
        }
        console.error('Database error inserting vote:', error);
        throw error;
      }

      console.log('Vote submitted successfully to database');
      return true;
    } catch (error) {
      console.error('Error submitting poll vote:', error);
      return false;
    }
  }

  // Poll: Check if player has voted
  async hasVoted(voterName: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('room_id', this.roomId)
        .eq('voter_name', voterName)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking vote:', error);
      return false;
    }
  }

  // Poll: Get all votes
  async getAllPollVotes(): Promise<Array<{ voter_name: string; voted_for: string }>> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('voter_name, voted_for')
        .eq('room_id', this.roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching poll votes:', error);
      return [];
    }
  }

  // Poll: Get vote counts
  async getPollResults(): Promise<Record<string, number>> {
    const votes = await this.getAllPollVotes();
    const results: Record<string, number> = {};

    votes.forEach((vote) => {
      results[vote.voted_for] = (results[vote.voted_for] || 0) + 1;
    });

    return results;
  }

  // Sweater Poll: Unlock sweater poll (called when host clicks "One More Thing" after gift poll)
  async unlockSweaterPoll(): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('rooms')
        .update({ sweater_poll_unlocked: true })
        .eq('id', this.roomId);

      // Fetch updated state
      await this.fetchRoomState();
    } catch (error) {
      console.error('Error unlocking sweater poll:', error);
    }
  }

  // Sweater Poll: Submit vote for ugliest sweater
  async submitSweaterVote(voterName: string, votedFor: string): Promise<boolean> {
    if (!supabase) {
      console.error('supabaseStore.submitSweaterVote: Supabase client not available');
      return false;
    }

    console.log('supabaseStore.submitSweaterVote called:', { voterName, votedFor, roomId: this.roomId });

    try {
      const { error } = await supabase.from('sweater_votes').insert({
        room_id: this.roomId,
        voter_name: voterName,
        voted_for: votedFor,
      });

      if (error) {
        // Check if it's a unique constraint violation (already voted)
        if (error.code === '23505') {
          console.log('Sweater vote rejected: voter already voted (unique constraint)');
          return false;
        }
        console.error('Database error inserting sweater vote:', error);
        throw error;
      }

      console.log('Sweater vote submitted successfully to database');
      return true;
    } catch (error) {
      console.error('Error submitting sweater vote:', error);
      return false;
    }
  }

  // Sweater Poll: Check if player has voted for sweater
  async hasSweaterVoted(voterName: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('sweater_votes')
        .select('id')
        .eq('room_id', this.roomId)
        .eq('voter_name', voterName)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking sweater vote:', error);
      return false;
    }
  }

  // Sweater Poll: Get all sweater votes
  async getAllSweaterVotes(): Promise<Array<{ voter_name: string; voted_for: string }>> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('sweater_votes')
        .select('voter_name, voted_for')
        .eq('room_id', this.roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching sweater votes:', error);
      return [];
    }
  }

  // Sweater Poll: Get vote counts
  async getSweaterPollResults(): Promise<Record<string, number>> {
    const votes = await this.getAllSweaterVotes();
    const results: Record<string, number> = {};

    votes.forEach((vote) => {
      results[vote.voted_for] = (results[vote.voted_for] || 0) + 1;
    });

    return results;
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
          active_players: [],
          results_unlocked: false,
          poll_unlocked: false,
          sweater_poll_unlocked: false,
        })
        .eq('id', this.roomId);

      // Delete all data for this room
      await supabase.from('submissions').delete().eq('room_id', this.roomId);
      await supabase.from('actual_santas').delete().eq('room_id', this.roomId);
      await supabase.from('poll_votes').delete().eq('room_id', this.roomId);
      await supabase.from('sweater_votes').delete().eq('room_id', this.roomId);
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
