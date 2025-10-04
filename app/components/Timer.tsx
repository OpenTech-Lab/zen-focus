'use client';

import { useEffect, useRef, useState } from 'react';
import { useTimer } from '@/lib/hooks/useTimer';
import { useNotification } from '@/lib/hooks/useNotification';
import { formatTime } from '@/lib/utils/formatTime';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import DurationInput from './DurationInput';

interface TimerProps {
  duration: number;
  title?: string;
  onComplete?: () => void;
}

export default function Timer({ duration, title = 'Focus Session', onComplete }: TimerProps) {
  const { timeLeft, isRunning, isComplete, start, pause, reset, setDuration } = useTimer(duration);
  const { notify } = useNotification();
  const prevCompleteRef = useRef(false);
  const prevDurationRef = useRef(duration);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Update duration when prop changes (not when custom duration is set)
  useEffect(() => {
    if (duration !== prevDurationRef.current && !isRunning && !isComplete) {
      setDuration(duration);
      prevDurationRef.current = duration;
    }
  }, [duration, isRunning, isComplete, setDuration]);

  // Handle completion
  useEffect(() => {
    if (isComplete && !prevCompleteRef.current) {
      notify(
        `${title} Complete!`,
        'Great work! Take a break and recharge.'
      );
      if (onComplete) {
        onComplete();
      }
    }
    prevCompleteRef.current = isComplete;
  }, [isComplete, title, notify, onComplete]);

  const progress = ((duration - timeLeft) / duration) * 100;

  const handleCustomDuration = (newDuration: number) => {
    setDuration(newDuration);
    setShowCustomInput(false);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Custom Duration Input */}
      {showCustomInput && !isRunning && (
        <div className="w-full max-w-md">
          <DurationInput
            onDurationSet={handleCustomDuration}
            onCancel={() => setShowCustomInput(false)}
            defaultValue={timeLeft}
          />
        </div>
      )}

      {/* Timer Display */}
      <div className="relative">
        <svg className="w-64 h-64 transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          {/* Progress Circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className="text-primary transition-all duration-1000 ease-linear"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-bold font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 items-center">
        <div className="flex gap-4">
          {!isRunning ? (
            <Button
              size="lg"
              onClick={start}
              disabled={timeLeft === 0}
              className="w-32"
            >
              <Play className="mr-2 h-5 w-5" />
              Start
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={pause}
              variant="secondary"
              className="w-32"
            >
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </Button>
          )}
          <Button
            size="lg"
            onClick={reset}
            variant="outline"
            className="w-32"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>

        {/* Custom Duration Button */}
        {!isRunning && !showCustomInput && (
          <Button
            variant="ghost"
            onClick={() => setShowCustomInput(true)}
            className="text-sm"
          >
            <Clock className="mr-2 h-4 w-4" />
            Custom Duration
          </Button>
        )}
      </div>

      {/* Status Message */}
      {isComplete && (
        <p className="text-lg font-medium text-primary animate-pulse">
          Time&apos;s up! Great work! 🎉
        </p>
      )}
    </div>
  );
}
