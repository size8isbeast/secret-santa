import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const hasValidCredentials =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('placeholder');

if (!hasValidCredentials && typeof window !== 'undefined') {
  console.warn(
    'Supabase credentials not found. Using mock store. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  );
}

// Only create client if we have valid credentials
export const supabase: SupabaseClient | null = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types (based on schema)
export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          opening_order: string[];
          current_index: number;
          round_started_at: string | null;
          duration_sec: number;
          is_started: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opening_order?: string[];
          current_index?: number;
          round_started_at?: string | null;
          duration_sec?: number;
          is_started?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          opening_order?: string[];
          current_index?: number;
          round_started_at?: string | null;
          duration_sec?: number;
          is_started?: boolean;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          room_id: string;
          player_name: string;
          round_index: number;
          guessed_santa_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_name: string;
          round_index: number;
          guessed_santa_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_name?: string;
          round_index?: number;
          guessed_santa_name?: string;
        };
      };
    };
  };
}
