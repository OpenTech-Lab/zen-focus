'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { useTimer } from '@/lib/hooks/useTimer';
import { useNotification } from '@/lib/hooks/useNotification';
import { formatTime } from '@/lib/utils/formatTime';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import DurationInput from './DurationInput';
import type { FocusMode } from '@/lib/constants/focus-modes';

/**
 * Props for the Timer component.
 *
 * @interface TimerProps
 *
 * @property {number} duration - Initial timer duration in seconds
 * @property {string} [title='Focus Session'] - Title displayed in completion notification
 * @property {() => void} [onComplete] - Optional callback invoked when timer completes
 * @property {FocusMode} [focusMode='study'] - Type of focus session
 * @property {(focusMode: FocusMode, duration: number, completed: boolean) => void} [onSessionComplete] - Callback for tracking session completion with mode, duration, and completion status
 */
interface TimerProps {
  duration: number;
  title?: string;
  onComplete?: () => void;
  focusMode?: FocusMode;
  onSessionComplete?: (focusMode: FocusMode, duration: number, completed: boolean) => void;
}

/**
 * Countdown timer component with customizable duration and focus modes.
 *
 * This component provides a visual countdown timer with start/pause/reset controls,
 * progress visualization, and session tracking. It supports custom durations and
 * tracks both completed and incomplete sessions.
 *
 * @component
 *
 * @remarks
 * - Displays circular progress indicator with remaining time
 * - Supports custom duration input during idle state
 * - Tracks session start and completion for analytics
 * - Sends browser notifications on completion
 * - Records incomplete sessions when paused after running for at least 1 second
 * - Memoized to prevent unnecessary re-renders
 * - Automatically resets when duration prop changes (only when timer is idle)
 *
 * @param {TimerProps} props - Component props
 *
 * @example
 * ```tsx
 * <Timer
 *   duration={1500} // 25 minutes in seconds
 *   title="Study Session"
 *   focusMode="study"
 *   onComplete={() => console.log('Timer complete!')}
 *   onSessionComplete={(mode, duration, completed) => {
 *     console.log(`${mode} session: ${duration}s, completed: ${completed}`);
 *   }}
 * />
 * ```
 *
 * @returns {React.ReactElement} Timer component with controls and progress display
 */
const Timer = memo(function Timer({ duration, title = 'Focus Session', onComplete, focusMode = 'study', onSessionComplete }: TimerProps) {
  const { timeLeft, isRunning, isComplete, start, pause, reset, setDuration } = useTimer(duration);
  const { notify } = useNotification();

  /**
   * Tracks previous completion state to detect state changes.
   * @type {React.MutableRefObject<boolean>}
   */
  const prevCompleteRef = useRef(false);

  /**
   * Tracks previous duration prop to detect external duration changes.
   * @type {React.MutableRefObject<number>}
   */
  const prevDurationRef = useRef(duration);

  /**
   * Controls visibility of custom duration input.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [showCustomInput, setShowCustomInput] = useState(false);

  /**
   * Stores the time remaining when timer starts, used to calculate session duration.
   * @type {React.MutableRefObject<number | null>}
   */
  const startTimeRef = useRef<number | null>(null);

  /**
   * Stores the initial duration for the current session.
   * @type {React.MutableRefObject<number>}
   */
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

  /**
   * Calculates the progress percentage for the circular progress indicator.
   * @type {number}
   */
  const progress = ((duration - timeLeft) / duration) * 100;

  /**
   * Handles setting a custom duration from the DurationInput component.
   * Updates the timer duration and hides the custom input.
   *
   * @param {number} newDuration - New duration in seconds to set for the timer
   */
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
            className="text-primary transition-all duration-300 ease-out"
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
