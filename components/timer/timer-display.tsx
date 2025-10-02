"use client";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
}

export function TimerDisplay({ minutes, seconds }: TimerDisplayProps) {
  return (
    <div className="text-6xl font-bold tabular-nums">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
