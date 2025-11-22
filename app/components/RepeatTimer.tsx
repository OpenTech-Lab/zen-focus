'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimer } from '@/lib/hooks/useTimer';
import { useNotification } from '@/lib/hooks/useNotification';
import { formatTime } from '@/lib/utils/formatTime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw } from 'lucide-react';

/**
 * Props for the RepeatTimer component.
 */
interface RepeatTimerProps {
  onSessionComplete?: (focusMode: string, duration: number, completed: boolean) => void;
}

/**
 * Repeat/Interval Timer component that runs multiple consecutive timer sessions.
 *
 * @component
 */
export default function RepeatTimer({ onSessionComplete }: RepeatTimerProps) {
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [totalRepetitions, setTotalRepetitions] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isConfiguring, setIsConfiguring] = useState<boolean>(true);
  const [allRoundsComplete, setAllRoundsComplete] = useState<boolean>(false);
  const processedRoundRef = useRef<number>(0);

  const durationSeconds = durationMinutes * 60;
  const { timeLeft, isRunning, isComplete, start, pause, reset: resetTimer, setDuration } = useTimer(durationSeconds);
  const { notify } = useNotification();

  // Validate inputs
  const isValidConfig = durationMinutes > 0 && totalRepetitions > 0;

  // Calculate and format total time
  const totalMinutes = durationMinutes * totalRepetitions;
  const formatTotalTime = () => {
    if (totalMinutes === 0) return null;

    if (totalMinutes < 60) {
      return `Total: ${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      if (mins === 0) {
        return `Total: ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        return `Total: ${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
      }
    }
  };

  /**
   * Handle start button click - begin interval timer
   */
  const handleStart = useCallback(() => {
    if (!isValidConfig) return;

    setIsConfiguring(false);
    setCurrentRound(1);
    setAllRoundsComplete(false);
    processedRoundRef.current = 0;
  }, [isValidConfig]);

  /**
   * Auto-start first round when leaving configuration
   */
  useEffect(() => {
    if (!isConfiguring && currentRound === 1 && !isRunning) {
      setDuration(durationSeconds);
      start();
    }
  }, [isConfiguring, currentRound, durationSeconds, isRunning, setDuration, start]);

  /**
   * Handle reset button click - return to configuration
   */
  const handleReset = useCallback(() => {
    resetTimer();
    setIsConfiguring(true);
    setCurrentRound(0);
    setAllRoundsComplete(false);
  }, [resetTimer]);

  /**
   * Handle round completion and advance to next round
   */
  useEffect(() => {
    if (isComplete && currentRound > 0 && currentRound <= totalRepetitions && processedRoundRef.current !== currentRound) {
      // Mark this round as processed
      processedRoundRef.current = currentRound;

      // Track completed round
      if (onSessionComplete) {
        onSessionComplete('interval', durationSeconds, true);
      }

      // Send notification
      notify(`Round ${currentRound} of ${totalRepetitions} completed!`);

      // Check if more rounds remaining
      if (currentRound < totalRepetitions) {
        // Advance to next round immediately
        setCurrentRound(prev => prev + 1);
      } else {
        // All rounds complete
        setAllRoundsComplete(true);
        notify('All rounds completed! Great work! 🎉');
      }
    }
  }, [isComplete, currentRound, totalRepetitions, durationSeconds, onSessionComplete, notify]);

  /**
   * Auto-start next round when currentRound changes
   */
  useEffect(() => {
    if (currentRound > 1 && currentRound <= totalRepetitions && !allRoundsComplete) {
      // Reset and start the next round
      resetTimer();
      setDuration(durationSeconds);
      start();
    }
  }, [currentRound, totalRepetitions, allRoundsComplete, resetTimer, setDuration, durationSeconds, start]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {isConfiguring ? (
        /* Configuration View */
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Interval Timer</h2>
            <p className="text-muted-foreground">
              Configure your interval timer
            </p>
          </div>

          <div className="space-y-4">
            {/* Duration Input */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="120"
                value={durationMinutes || ''}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                placeholder="Enter duration in minutes"
              />
            </div>

            {/* Repetitions Input */}
            <div className="space-y-2">
              <Label htmlFor="repetitions">Repetitions</Label>
              <Input
                id="repetitions"
                type="number"
                min="1"
                max="99"
                value={totalRepetitions || ''}
                onChange={(e) => setTotalRepetitions(parseInt(e.target.value) || 0)}
                placeholder="Number of rounds"
              />
            </div>

            {/* Total Time Display */}
            {formatTotalTime() && (
              <div className="text-center p-3 bg-muted rounded-md">
                <p className="text-sm font-medium text-muted-foreground">
                  {formatTotalTime()}
                </p>
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={handleStart}
              disabled={!isValidConfig}
              className="w-full"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Interval Timer
            </Button>
          </div>
        </div>
      ) : (
        /* Timer View */
        <div className="flex flex-col items-center space-y-6">
          {/* Round Counter */}
          {!allRoundsComplete && (
            <div className="text-center space-y-1">
              <p className="text-lg text-muted-foreground">
                Round {currentRound} of {totalRepetitions}
              </p>
            </div>
          )}

          {/* Timer Display */}
          {allRoundsComplete ? (
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-green-600 dark:text-green-400">
                ✓
              </div>
              <h2 className="text-3xl font-bold">All Rounds Completed!</h2>
              <p className="text-lg text-muted-foreground">
                Great work! You completed {totalRepetitions} rounds of {durationMinutes} {durationMinutes === 1 ? 'minute' : 'minutes'} each.
              </p>
            </div>
          ) : (
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 120 * (1 - timeLeft / durationSeconds)
                  }`}
                  className="text-primary transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          {!allRoundsComplete && (
            <div className="flex gap-4">
              <Button
                onClick={isRunning ? pause : start}
                size="lg"
                variant={isRunning ? 'secondary' : 'default'}
                aria-label={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Resume
                  </>
                )}
              </Button>

              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          )}

          {/* Reset Button after completion */}
          {allRoundsComplete && (
            <Button
              onClick={handleReset}
              size="lg"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              New Interval
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
