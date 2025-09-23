// Temporary TypeScript models for Amplify DataStore
// These will be replaced by generated models when Amplify backend is set up

export interface User {
  id: string
  email: string
  createdAt: string
  lastActiveAt: string
  totalFocusTime: number
  currentStreak: number
  longestStreak: number
  preferences?: UserPreferences
}

export interface UserPreferences {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  defaultSessionMode: 'study' | 'deepwork' | 'yoga' | 'zen'
  ambientSound: 'rain' | 'forest' | 'ocean' | 'silence'
  ambientVolume: number // 0-100
  notifications: boolean
  autoStartBreaks: boolean
  customIntervals?: CustomInterval[]
}

export interface Session {
  id: string
  userId?: string // Optional for guest sessions
  mode: 'study' | 'deepwork' | 'yoga' | 'zen'
  startTime: string
  endTime: string
  plannedDuration: number // in minutes
  actualDuration: number // in minutes
  completedFully: boolean
  pauseCount: number
  totalPauseTime: number // in minutes
  ambientSound: 'rain' | 'forest' | 'ocean' | 'silence'
  notes?: string
}

export interface SessionMode {
  id: string
  name: string
  description: string
  defaultWorkDuration: number // in minutes
  defaultBreakDuration: number // in minutes
  color: string
  icon: string
  isCustomizable: boolean
  maxWorkDuration?: number
  maxBreakDuration?: number
}

export interface CustomInterval {
  id: string
  userId: string
  name: string
  workDuration: number // in minutes
  breakDuration: number // in minutes
  sessionMode: 'study' | 'deepwork' | 'yoga' | 'zen'
  createdAt: string
  isActive: boolean
}

export interface TimerState {
  id: string
  userId?: string
  isActive: boolean
  isPaused: boolean
  mode: 'study' | 'deepwork' | 'yoga' | 'zen'
  phase: 'work' | 'break'
  timeRemaining: number // in seconds
  totalElapsed: number // in seconds
  pauseStartTime?: string
  sessionStartTime: string
  currentCycle: number
  totalPauseTime: number // in seconds
}

// Default session modes configuration
export const DEFAULT_SESSION_MODES: SessionMode[] = [
  {
    id: 'study',
    name: 'Study Mode',
    description: 'Traditional Pomodoro technique for focused learning',
    defaultWorkDuration: 25,
    defaultBreakDuration: 5,
    color: '#10B981', // emerald-500
    icon: 'book',
    isCustomizable: true,
    maxWorkDuration: 90,
    maxBreakDuration: 30,
  },
  {
    id: 'deepwork',
    name: 'Deep Work',
    description: 'Extended focus periods for complex tasks',
    defaultWorkDuration: 50,
    defaultBreakDuration: 10,
    color: '#3B82F6', // blue-500
    icon: 'brain',
    isCustomizable: true,
    maxWorkDuration: 120,
    maxBreakDuration: 30,
  },
  {
    id: 'yoga',
    name: 'Yoga & Meditation',
    description: 'Customizable intervals for breathing and poses',
    defaultWorkDuration: 10,
    defaultBreakDuration: 2,
    color: '#8B5CF6', // violet-500
    icon: 'flower',
    isCustomizable: true,
    maxWorkDuration: 60,
    maxBreakDuration: 15,
  },
  {
    id: 'zen',
    name: 'Zen Mode',
    description: 'Open-ended timer for flexible focus',
    defaultWorkDuration: 0, // open-ended
    defaultBreakDuration: 0,
    color: '#6B7280', // gray-500
    icon: 'infinity',
    isCustomizable: false,
  },
]

// Validation functions
export const validateUser = (user: Partial<User>): string[] => {
  const errors: string[] = []

  if (!user.email || !/\S+@\S+\.\S+/.test(user.email)) {
    errors.push('Valid email is required')
  }

  if (user.totalFocusTime !== undefined && user.totalFocusTime < 0) {
    errors.push('Total focus time cannot be negative')
  }

  if (user.currentStreak !== undefined && user.currentStreak < 0) {
    errors.push('Current streak cannot be negative')
  }

  if (user.longestStreak !== undefined && user.longestStreak < 0) {
    errors.push('Longest streak cannot be negative')
  }

  return errors
}

export const validateSession = (session: Partial<Session>): string[] => {
  const errors: string[] = []

  if (!session.mode || !['study', 'deepwork', 'yoga', 'zen'].includes(session.mode)) {
    errors.push('Valid session mode is required')
  }

  if (session.plannedDuration !== undefined && session.plannedDuration <= 0) {
    errors.push('Planned duration must be positive')
  }

  if (session.actualDuration !== undefined && session.actualDuration < 0) {
    errors.push('Actual duration cannot be negative')
  }

  if (session.pauseCount !== undefined && session.pauseCount < 0) {
    errors.push('Pause count cannot be negative')
  }

  if (
    session.totalPauseTime !== undefined &&
    session.actualDuration !== undefined &&
    session.totalPauseTime > session.actualDuration
  ) {
    errors.push('Total pause time cannot exceed actual duration')
  }

  if (session.startTime && session.endTime) {
    const start = new Date(session.startTime)
    const end = new Date(session.endTime)
    if (start >= end) {
      errors.push('End time must be after start time')
    }
  }

  return errors
}

export const validateUserPreferences = (preferences: Partial<UserPreferences>): string[] => {
  const errors: string[] = []

  if (preferences.theme && !['light', 'dark', 'system'].includes(preferences.theme)) {
    errors.push('Theme must be light, dark, or system')
  }

  if (
    preferences.defaultSessionMode &&
    !['study', 'deepwork', 'yoga', 'zen'].includes(preferences.defaultSessionMode)
  ) {
    errors.push('Default session mode must be study, deepwork, yoga, or zen')
  }

  if (
    preferences.ambientSound &&
    !['rain', 'forest', 'ocean', 'silence'].includes(preferences.ambientSound)
  ) {
    errors.push('Ambient sound must be rain, forest, ocean, or silence')
  }

  if (
    preferences.ambientVolume !== undefined &&
    (preferences.ambientVolume < 0 || preferences.ambientVolume > 100)
  ) {
    errors.push('Ambient volume must be between 0 and 100')
  }

  return errors
}

export const validateCustomInterval = (interval: Partial<CustomInterval>): string[] => {
  const errors: string[] = []

  if (!interval.name || interval.name.trim().length === 0) {
    errors.push('Interval name is required')
  }

  if (interval.name && interval.name.length > 50) {
    errors.push('Interval name must be 50 characters or less')
  }

  if (interval.workDuration !== undefined && interval.workDuration <= 0) {
    errors.push('Work duration must be positive')
  }

  if (interval.breakDuration !== undefined && interval.breakDuration < 0) {
    errors.push('Break duration cannot be negative')
  }

  if (
    interval.sessionMode &&
    !['study', 'deepwork', 'yoga', 'zen'].includes(interval.sessionMode)
  ) {
    errors.push('Session mode must be study, deepwork, yoga, or zen')
  }

  return errors
}

// Helper functions
export const createDefaultUserPreferences = (userId: string): UserPreferences => ({
  id: `${userId}_preferences`,
  userId,
  theme: 'system',
  defaultSessionMode: 'study',
  ambientSound: 'silence',
  ambientVolume: 50,
  notifications: true,
  autoStartBreaks: true,
})

export const getSessionModeById = (id: string): SessionMode | undefined => {
  return DEFAULT_SESSION_MODES.find((mode) => mode.id === id)
}

export const calculateSessionStats = (sessions: Session[]) => {
  const totalSessions = sessions.length
  const completedSessions = sessions.filter((s) => s.completedFully)
  const totalFocusTime = sessions.reduce((sum, s) => sum + s.actualDuration, 0)
  const averageSessionDuration = totalSessions > 0 ? totalFocusTime / totalSessions : 0
  const completionRate = totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0

  const modeBreakdown = sessions.reduce(
    (acc, session) => {
      acc[session.mode] = (acc[session.mode] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    totalSessions,
    totalFocusTime,
    averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    modeBreakdown,
  }
}