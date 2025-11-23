"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTimer } from "@/lib/hooks/useTimer";
import { useNotification } from "@/lib/hooks/useNotification";
import { formatTime } from "@/lib/utils/formatTime";
import { TimerSession } from "@/lib/types/timer-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Pause, RotateCcw } from "lucide-react";

/**
 * Props for the RepeatTimer component.
 */
interface RepeatTimerProps {
  onSessionComplete?: (
    focusMode: TimerSession["focusMode"],
    duration: number,
    completed: boolean
  ) => void;
}

/**
 * Repeat/Interval Timer component that runs multiple consecutive timer sessions.
 *
 * @component
 */
export default function RepeatTimer({ onSessionComplete }: RepeatTimerProps) {
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [totalRepetitions, setTotalRepetitions] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isConfiguring, setIsConfiguring] = useState<boolean>(true);
  const [allRoundsComplete, setAllRoundsComplete] = useState<boolean>(false);
  const [beepEnabled, setBeepEnabled] = useState<boolean>(false);
  const processedRoundRef = useRef<number>(0);
  const firstRoundStartedRef = useRef<boolean>(false);

  const {
    timeLeft,
    isRunning,
    isComplete,
    start,
    pause,
    reset: resetTimer,
    setDuration,
  } = useTimer(durationSeconds);
  const { playSound, showNotification } = useNotification();

  // Validate inputs
  const isValidConfig = durationSeconds > 0 && totalRepetitions > 0;

  // Calculate elapsed total time
  const calculateElapsedTime = () => {
    if (currentRound === 0) return 0;

    // Time from completed rounds + time elapsed in current round
    const completedRoundsTime = (currentRound - 1) * durationSeconds;
    const currentRoundElapsed = durationSeconds - timeLeft;
    return completedRoundsTime + currentRoundElapsed;
  };

  const elapsedSeconds = calculateElapsedTime();

  // Calculate and format total time
  const totalSeconds = durationSeconds * totalRepetitions;
  const formatTotalTime = () => {
    if (totalSeconds === 0) return null;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
    }

    return `Total: ${parts.join(" ")}`;
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
    firstRoundStartedRef.current = false;
  }, [isValidConfig]);

  /**
   * Auto-start first round when leaving configuration
   */
  useEffect(() => {
    if (
      !isConfiguring &&
      currentRound === 1 &&
      !isRunning &&
      !firstRoundStartedRef.current
    ) {
      setDuration(durationSeconds);
      start();
      firstRoundStartedRef.current = true;
    }
  }, [
    isConfiguring,
    currentRound,
    durationSeconds,
    isRunning,
    setDuration,
    start,
  ]);

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
    if (
      isComplete &&
      currentRound > 0 &&
      currentRound <= totalRepetitions &&
      processedRoundRef.current !== currentRound
    ) {
      // Mark this round as processed
      processedRoundRef.current = currentRound;

      // Track completed round
      if (onSessionComplete) {
        onSessionComplete("interval", durationSeconds, true);
      }

      // Send notification
      if (beepEnabled) {
        playSound();
      }
      showNotification(
        `Round ${currentRound} of ${totalRepetitions} completed!`,
        "Keep going!"
      );

      // Check if more rounds remaining
      if (currentRound < totalRepetitions) {
        // Move to next round; dedicated effects will reset and restart timer
        setCurrentRound((prev) => prev + 1);
      } else {
        // All rounds complete
        setAllRoundsComplete(true);
        if (beepEnabled) {
          playSound();
        }
        showNotification("All rounds completed!", "Great work! 🎉");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, onSessionComplete]);

  /**
   * Prepare and start next round after advancing currentRound
   */
  useEffect(() => {
    if (
      currentRound > 1 &&
      currentRound <= totalRepetitions &&
      !allRoundsComplete
    ) {
      setDuration(durationSeconds);
      start();
    }
  }, [
    currentRound,
    totalRepetitions,
    allRoundsComplete,
    durationSeconds,
    setDuration,
    start,
  ]);

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
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="7200"
                value={durationSeconds || ""}
                onChange={(e) =>
                  setDurationSeconds(parseInt(e.target.value) || 0)
                }
                placeholder="Enter duration in seconds"
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
                value={totalRepetitions || ""}
                onChange={(e) =>
                  setTotalRepetitions(parseInt(e.target.value) || 0)
                }
                placeholder="Number of rounds"
              />
            </div>

            {/* Beep Sound Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="beep-sound"
                checked={beepEnabled}
                onCheckedChange={(checked) => setBeepEnabled(checked === true)}
                aria-label="Beep sound"
              />
              <Label
                htmlFor="beep-sound"
                className="text-sm font-normal cursor-pointer"
              >
                Beep sound when each round completes
              </Label>
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
              <p className="text-sm text-muted-foreground/80">
                Elapsed: {formatTime(elapsedSeconds)}
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
                Great work! You completed {totalRepetitions} rounds of{" "}
                {formatTime(durationSeconds)} each.
              </p>
              <p className="text-md text-muted-foreground/80">
                Total Elapsed: {formatTime(elapsedSeconds)}
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
                  className="text-primary transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          {!allRoundsComplete && (
            <div className="flex gap-4">
              <Button
                onClick={isRunning ? pause : start}
                size="lg"
                variant={isRunning ? "secondary" : "default"}
                aria-label={isRunning ? "Pause" : "Resume"}
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

              <Button onClick={handleReset} size="lg" variant="outline">
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          )}

          {/* Reset Button after completion */}
          {allRoundsComplete && (
            <Button onClick={handleReset} size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              New Interval
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
