// Re-export FocusMode from centralized configuration
export type { FocusMode } from './constants/focus-modes';

/**
 * @deprecated Use FocusMode instead. TimerMode is kept for backwards compatibility.
 */
export type TimerMode = 'study' | 'work' | 'yoga' | 'meditation';

export interface TimerSession {
  id: string;
  mode: TimerMode;
  duration: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface UserPreferences {
  userId: string;
  defaultDuration: {
    study: number;
    work: number;
    yoga: number;
    meditation: number;
  };
  theme: 'light' | 'dark';
  soundEnabled: boolean;
}
