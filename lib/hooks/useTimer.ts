"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setDuration: (seconds: number) => void;
}

export function useTimer(initialDuration: number = 1500): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [duration, setDurationState] = useState(initialDuration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
      setIsComplete(false);
    }
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsComplete(false);
    setTimeLeft(duration);
  }, [duration]);

  const setDuration = useCallback((seconds: number) => {
    setDurationState(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  return {
    timeLeft,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    setDuration,
  };
}
