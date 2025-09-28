import { z } from 'zod'

/**
 * Session mode enum values from OpenAPI specification
 */
export type SessionMode = 'study' | 'deepwork' | 'yoga' | 'zen'

/**
 * Timer phase enum values from OpenAPI specification
 */
export type TimerPhase = 'work' | 'break'

/**
 * TimerState data model interface based on OpenAPI specification
 * Represents the current state of a timer in the ZenFocus application
 */
export interface TimerState {
  /** Whether timer is currently running */
  isActive: boolean
  /** Whether timer is paused */
  isPaused: boolean
  /** Current session mode */
  mode: SessionMode
  /** Current timer phase (work or break) */
  phase: TimerPhase
  /** Seconds remaining in current phase (non-negative integer) */
  timeRemaining: number
  /** Total elapsed seconds (non-negative integer) */
  totalElapsed: number
  /** Current cycle number (minimum 1) */
  currentCycle: number
}

/**
 * Zod schema for TimerState validation
 * Provides runtime validation matching the OpenAPI specification
 */
export const TimerStateSchema = z.object({
  isActive: z.boolean({ message: 'isActive must be a boolean value' }),
  isPaused: z.boolean({ message: 'isPaused must be a boolean value' }),
  mode: z.enum(['study', 'deepwork', 'yoga', 'zen'], {
    message: 'mode must be one of: study, deepwork, yoga, zen',
  }),
  phase: z.enum(['work', 'break'], {
    message: 'phase must be either work or break',
  }),
  timeRemaining: z.number().int().min(0, 'timeRemaining must be a non-negative integer'),
  totalElapsed: z.number().int().min(0, 'totalElapsed must be a non-negative integer'),
  currentCycle: z.number().int().min(1, 'currentCycle must be at least 1'),
})

/**
 * Type derived from Zod schema for compile-time type checking
 */
export type TimerStateType = z.infer<typeof TimerStateSchema>

/**
 * Helper function to create a new timer state with default values
 * @param mode - Session mode for the timer
 * @param timeRemaining - Initial time remaining in seconds
 * @returns New TimerState object with default values
 */
export function createTimerState(mode: SessionMode, timeRemaining: number): TimerState {
  return {
    isActive: false,
    isPaused: false,
    mode,
    phase: 'work',
    timeRemaining,
    totalElapsed: 0,
    currentCycle: 1,
  }
}

/**
 * Helper function to validate timer state data at runtime
 * @param timerStateData - Object to validate as TimerState
 * @returns Validation result with parsed data or error details
 */
export function validateTimerState(
  timerStateData: unknown
): z.SafeParseReturnType<unknown, TimerState> {
  return TimerStateSchema.safeParse(timerStateData)
}

/**
 * Helper function to start a timer
 * @param timerState - Current timer state
 * @returns Updated timer state with isActive=true and isPaused=false
 */
export function startTimer(timerState: TimerState): TimerState {
  if (timerState.isActive && !timerState.isPaused) {
    // Timer is already active and not paused, no change needed
    return timerState
  }

  return {
    ...timerState,
    isActive: true,
    isPaused: false,
  }
}

/**
 * Helper function to pause an active timer
 * @param timerState - Current timer state
 * @returns Updated timer state with isActive=false and isPaused=true
 */
export function pauseTimer(timerState: TimerState): TimerState {
  if (!timerState.isActive) {
    // Timer is not active, no change needed
    return timerState
  }

  return {
    ...timerState,
    isActive: false,
    isPaused: true,
  }
}

/**
 * Helper function to resume a paused timer
 * @param timerState - Current timer state
 * @returns Updated timer state with isActive=true and isPaused=false
 */
export function resumeTimer(timerState: TimerState): TimerState {
  if (!timerState.isPaused) {
    // Timer is not paused, no change needed
    return timerState
  }

  return {
    ...timerState,
    isActive: true,
    isPaused: false,
  }
}

/**
 * Helper function to reset timer to initial state
 * @param timerState - Current timer state
 * @param initialTime - Time to reset to in seconds
 * @returns Reset timer state
 */
export function resetTimer(timerState: TimerState, initialTime: number): TimerState {
  return {
    ...timerState,
    isActive: false,
    isPaused: false,
    phase: 'work',
    timeRemaining: initialTime,
    totalElapsed: 0,
    currentCycle: 1,
  }
}

/**
 * Helper function to switch timer phase (work <-> break)
 * @param timerState - Current timer state
 * @param newTimeRemaining - Time for the new phase in seconds
 * @returns Updated timer state with switched phase
 */
export function switchPhase(timerState: TimerState, newTimeRemaining: number): TimerState {
  const newPhase: TimerPhase = timerState.phase === 'work' ? 'break' : 'work'

  return {
    ...timerState,
    phase: newPhase,
    timeRemaining: newTimeRemaining,
    isActive: false,
    isPaused: false,
  }
}

/**
 * Helper function to increment the current cycle
 * @param timerState - Current timer state
 * @returns Updated timer state with incremented cycle
 */
export function incrementCycle(timerState: TimerState): TimerState {
  return {
    ...timerState,
    currentCycle: timerState.currentCycle + 1,
  }
}

/**
 * Helper function to update time remaining
 * @param timerState - Current timer state
 * @param newTimeRemaining - New time remaining in seconds
 * @returns Updated timer state with new time remaining (minimum 0)
 */
export function updateTimeRemaining(timerState: TimerState, newTimeRemaining: number): TimerState {
  return {
    ...timerState,
    timeRemaining: Math.max(0, newTimeRemaining),
  }
}

/**
 * Helper function to check if timer can be started
 * @param timerState - Current timer state
 * @returns True if timer can be started
 */
export function canStart(timerState: TimerState): boolean {
  return !timerState.isActive && timerState.timeRemaining > 0
}

/**
 * Helper function to check if timer can be paused
 * @param timerState - Current timer state
 * @returns True if timer can be paused
 */
export function canPause(timerState: TimerState): boolean {
  return timerState.isActive
}

/**
 * Helper function to check if timer can be resumed
 * @param timerState - Current timer state
 * @returns True if timer can be resumed
 */
export function canResume(timerState: TimerState): boolean {
  return timerState.isPaused
}

/**
 * Helper function to check if timer is actively running
 * @param timerState - Current timer state
 * @returns True if timer is active and not paused
 */
export function isActiveTimer(timerState: TimerState): boolean {
  return timerState.isActive && !timerState.isPaused
}

/**
 * Helper function to calculate timer progress as percentage
 * @param timerState - Current timer state
 * @param initialTime - Initial time for the phase in seconds
 * @returns Progress percentage (0-100)
 */
export function getTimerProgress(timerState: TimerState, initialTime: number): number {
  if (initialTime <= 0) return 100

  const elapsed = initialTime - timerState.timeRemaining
  const progress = (elapsed / initialTime) * 100

  return Math.min(100, Math.max(0, progress))
}

/**
 * Helper function to get elapsed time in current cycle
 * @param timerState - Current timer state
 * @param initialTime - Initial time for the phase in seconds
 * @returns Elapsed time in seconds for current phase
 */
export function getElapsedInCurrentCycle(timerState: TimerState, initialTime: number): number {
  return Math.max(0, initialTime - timerState.timeRemaining)
}
