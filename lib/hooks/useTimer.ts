'use client';

import { useEffect, useState } from 'react';

interface UseTimerOptions {
  startedAt: number | null;
  durationSec: number;
}

export function useTimer({ startedAt, durationSec }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number>(durationSec);

  useEffect(() => {
    if (!startedAt) {
      setTimeLeft(durationSec);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, durationSec - elapsed);
      setTimeLeft(remaining);
    }, 100); // Update frequently for smooth countdown

    return () => clearInterval(interval);
  }, [startedAt, durationSec]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft <= 10 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  return {
    timeLeft,
    minutes,
    seconds,
    isLowTime,
    isExpired,
  };
}
