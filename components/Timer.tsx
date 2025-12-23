'use client';

import { useTimer } from '@/lib/hooks/useTimer';

interface TimerProps {
  startedAt: number | null;
  durationSec: number;
}

export function Timer({ startedAt, durationSec }: TimerProps) {
  const { minutes, seconds, isLowTime, isExpired } = useTimer({
    startedAt,
    durationSec,
  });

  return (
    <div
      className={`text-8xl font-bold font-mono transition-colors ${
        isExpired
          ? 'text-red-600'
          : isLowTime
          ? 'text-orange-500'
          : 'text-gray-800'
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
