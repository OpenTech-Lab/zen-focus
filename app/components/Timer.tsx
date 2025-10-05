'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
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
  focusMode?: 'study' | 'work' | 'yoga' | 'meditation';
  onSessionComplete?: (focusMode: 'study' | 'work' | 'yoga' | 'meditation', duration: number, completed: boolean) => void;
}

const Timer = memo(function Timer({ duration, title = 'Focus Session', onComplete, focusMode = 'study', onSessionComplete }: TimerProps) {
  const { timeLeft, isRunning, isComplete, start, pause, reset, setDuration } = useTimer(duration);
  const { notify } = useNotification();
  const prevCompleteRef = useRef(false);
  const prevDurationRef = useRef(duration);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const initialDurationRef = useRef(duration);

  // Update duration when prop changes (not when custom duration is set)
  useEffect(() => {
    if (duration !== prevDurationRef.current && !isRunning && !isComplete) {
      setDuration(duration);
      prevDurationRef.current = duration;
      initialDurationRef.current = duration;
    }
  }, [duration, isRunning, isComplete, setDuration]);

  // Track when timer starts running
  useEffect(() => {
    if (isRunning && startTimeRef.current === null) {
      startTimeRef.current = timeLeft;
      initialDurationRef.current = timeLeft;
    }
  }, [isRunning, timeLeft]);

  // Handle session tracking when timer stops (paused or completed)
  useEffect(() => {
    if (!isRunning && startTimeRef.current !== null && !isComplete) {
      // Timer was paused - check if it ran for at least 1 second
      const timeElapsed = startTimeRef.current - timeLeft;
      if (timeElapsed >= 1 && onSessionComplete) {
        const sessionDuration = startTimeRef.current - timeLeft;
        onSessionComplete(focusMode, sessionDuration, false);
      }
      startTimeRef.current = null;
    }
  }, [isRunning, timeLeft, isComplete, focusMode, onSessionComplete]);

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
      // Track completed session
      if (startTimeRef.current !== null && onSessionComplete) {
        const sessionDuration = startTimeRef.current - timeLeft;
        if (sessionDuration >= 1) {
          onSessionComplete(focusMode, sessionDuration, true);
        }
        startTimeRef.current = null;
      }
    }
    prevCompleteRef.current = isComplete;
  }, [isComplete, title, notify, onComplete, timeLeft, focusMode, onSessionComplete]);

  const progress = ((duration - timeLeft) / duration) * 100;

  const handleCustomDuration = useCallback((newDuration: number) => {
    setDuration(newDuration);
    setShowCustomInput(false);
  }, [setDuration]);

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
});

export default Timer;
