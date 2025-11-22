export interface TimerSession {
  id: string;
  focusMode: "study" | "work" | "yoga" | "meditation" | "interval";
  duration: number; // in seconds
  completedAt: string; // ISO date string
  completed: boolean; // true if timer ran to completion
}

export interface TimerStatistics {
  totalSessions: number;
  completedSessions: number;
  totalTimeSpent: number; // in seconds
  currentStreak: number; // consecutive days with at least one completed session
  longestStreak: number;
  sessionsByMode: Record<string, number>;
}
