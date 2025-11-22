/**
 * Centralized focus modes configuration.
 * This is the single source of truth for all focus mode properties.
 */

export const FOCUS_MODES = ['study', 'work', 'yoga', 'meditation'] as const;

export type FocusMode = typeof FOCUS_MODES[number];

export interface FocusModeConfig {
  value: FocusMode;
  label: string;
  title: string;
  description: string;
  duration: number;
  color: string;
}

export const FOCUS_MODE_CONFIG: Record<FocusMode, Omit<FocusModeConfig, 'value'>> = {
  study: {
    label: 'Study',
    title: 'Study Timer',
    description: 'Focus timer for deep study sessions',
    duration: 1500, // 25 minutes
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  work: {
    label: 'Work',
    title: 'Deep Work Timer',
    description: 'Focused timer for deep work sessions',
    duration: 3600, // 60 minutes
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  yoga: {
    label: 'Yoga',
    title: 'Yoga Timer',
    description: 'Mindful timer for yoga practice',
    duration: 1800, // 30 minutes
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  meditation: {
    label: 'Meditation',
    title: 'Meditation Timer',
    description: 'Calm timer for meditation practice',
    duration: 600, // 10 minutes
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

/**
 * Get a list of all focus modes with their complete configuration.
 */
export const getFocusModeList = (): FocusModeConfig[] =>
  FOCUS_MODES.map((mode) => ({
    value: mode,
    ...FOCUS_MODE_CONFIG[mode],
  }));

/**
 * Get configuration for a specific focus mode.
 */
export const getFocusModeConfig = (mode: FocusMode): FocusModeConfig => ({
  value: mode,
  ...FOCUS_MODE_CONFIG[mode],
});

/**
 * Type guard to check if a string is a valid FocusMode.
 */
export const isFocusMode = (value: string): value is FocusMode =>
  FOCUS_MODES.includes(value as FocusMode);
