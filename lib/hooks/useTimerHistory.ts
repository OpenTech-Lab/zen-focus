'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimerSession, TimerStatistics } from '../types/timer-history';

const STORAGE_KEY = 'zenFocus_timerHistory';

export function useTimerHistory() {
  const [sessions, setSessions] = useState<TimerSession[]>([]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
      } catch (error) {
        console.error('Failed to parse timer history:', error);
        setSessions([]);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const addSession = useCallback((
    focusMode: TimerSession['focusMode'],
    duration: number,
    completed: boolean
  ) => {
    const newSession: TimerSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      focusMode,
      duration,
      completedAt: new Date().toISOString(),
      completed,
    };

    setSessions((prev) => [newSession, ...prev]);
  }, []);

  const clearHistory = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getStatistics = useCallback((): TimerStatistics => {
    const completedSessions = sessions.filter((s) => s.completed);
    const totalTimeSpent = completedSessions.reduce((acc, s) => acc + s.duration, 0);

    // Calculate session counts by mode
    const sessionsByMode = sessions.reduce((acc, session) => {
      acc[session.focusMode] = (acc[session.focusMode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate streaks (consecutive days with at least one completed session)
    const { currentStreak, longestStreak } = calculateStreaks(completedSessions);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalTimeSpent,
      currentStreak,
      longestStreak,
      sessionsByMode,
    };
  }, [sessions]);

  return {
    sessions,
    addSession,
    clearHistory,
    getStatistics,
  };
}

function calculateStreaks(completedSessions: TimerSession[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (completedSessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique dates (YYYY-MM-DD format)
  const dates = completedSessions
    .map((s) => new Date(s.completedAt).toISOString().split('T')[0])
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort()
    .reverse(); // Sort descending (most recent first)

  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Check if current streak is active (today or yesterday)
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;

    // Count consecutive days
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = Math.round(
      (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { currentStreak, longestStreak };
}
