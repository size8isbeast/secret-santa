'use client';

import { useEffect, useState } from 'react';
import { RoomState } from '../types';
import { store } from '../store';

// Custom hook to subscribe to room state changes
// Automatically uses Supabase if configured, otherwise uses mock store
export function useRoomState(): RoomState {
  const [state, setState] = useState<RoomState>(store.getRoomState());

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}
