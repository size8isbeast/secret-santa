import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with full time remaining', () => {
    const startedAt = Date.now();
    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 90 })
    );

    expect(result.current.timeLeft).toBe(90);
    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(30);
    expect(result.current.isExpired).toBe(false);
  });

  it('should countdown over time', () => {
    const startedAt = Date.now();
    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 90 })
    );

    // Advance time by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.timeLeft).toBe(60);
    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(0);
  });

  it('should mark as expired when time runs out', () => {
    const startedAt = Date.now();
    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 10 })
    );

    // Advance time past duration
    act(() => {
      vi.advanceTimersByTime(11000);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('should mark as low time when under 10 seconds', () => {
    const startedAt = Date.now();
    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 90 })
    );

    // Advance to 5 seconds remaining
    act(() => {
      vi.advanceTimersByTime(85000);
    });

    expect(result.current.timeLeft).toBe(5);
    expect(result.current.isLowTime).toBe(true);
  });

  it('should return full duration when startedAt is null', () => {
    const { result } = renderHook(() =>
      useTimer({ startedAt: null, durationSec: 90 })
    );

    expect(result.current.timeLeft).toBe(90);
    expect(result.current.isExpired).toBe(false);
  });

  it('should handle elapsed time already past duration', () => {
    const startedAt = Date.now() - 100000; // 100 seconds ago
    const { result } = renderHook(() =>
      useTimer({ startedAt, durationSec: 90 })
    );

    // Need to wait for effect to run
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });
});
