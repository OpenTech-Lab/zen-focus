/**
 * Centralized type exports for timer components
 * Provides a single import point for all timer-related types
 */

// Core timer controls types
export * from './timer-controls-types'

// Hook types
export * from './hooks/use-timer-controls.types'

// Utility types and helpers
export * from './timer-controls-utils.types'

// Re-export related types from timer models
export type {
  TimerState,
  SessionMode as SessionModeId,
  TimerPhase,
  createTimerState,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  switchPhase,
  incrementCycle,
  updateTimeRemaining,
  canStart,
  canPause,
  canResume,
  isActiveTimer,
  getTimerProgress
} from '../../lib/models/timer-state'

export type {
  SessionMode,
  validateSessionMode,
  createDefaultSessionModes,
  getSessionModeById
} from '../../lib/models/session-mode'

// Re-export timer service types
export type {
  TimerService,
  TimerEvents,
  TimerEventHandler,
  TimerError,
  TimerServiceError,
  TimerStateExport,
  createTimerService,
  getGlobalTimerService
} from '../../lib/services/timer-service'

// Type aliases for convenience
export type TimerServiceInstance = import('../../lib/services/timer-service').TimerService
export type TimerEventMap = import('../../lib/services/timer-service').TimerEvents

/**
 * Common type patterns for timer components
 */
export namespace TimerTypes {
  /** All possible timer states */
  export type AnyTimerState = import('../../lib/models/timer-state').TimerState

  /** All possible session modes */
  export type AnySessionMode = import('../../lib/models/session-mode').SessionMode

  /** Timer service event types */
  export type EventType = keyof import('../../lib/services/timer-service').TimerEvents

  /** Timer control button variants */
  export type ButtonVariant = import('./timer-controls-types').TimerButtonConfig['variant']

  /** Timer control actions */
  export type ControlAction = import('./timer-controls-types').TimerControlAction

  /** Hook return types */
  export type HookReturn = import('./hooks/use-timer-controls.types').UseTimerControlsHookReturn
}

/**
 * Type utility for creating strongly-typed timer components
 */
export interface StronglyTypedTimerComponent<TProps = {}> {
  (props: TProps & {
    timerService: TimerServiceInstance
  }): React.ReactElement | null
}

/**
 * Generic timer component props pattern
 */
export interface BaseTimerComponentProps {
  /** Timer service instance */
  timerService: TimerServiceInstance
  /** Additional CSS classes */
  className?: string
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Type for timer component with ref forwarding
 */
export interface TimerComponentWithRef<TProps = {}, TRef = HTMLElement>
  extends React.ForwardRefExoticComponent<TProps & React.RefAttributes<TRef>> {}

/**
 * Type guards namespace
 */
export namespace TimerTypeGuards {
  export const isTimerControlAction = import('./timer-controls-utils.types').isTimerControlAction
  export const isTimerControlState = import('./timer-controls-utils.types').isTimerControlState
  export const isTimerButtonConfig = import('./timer-controls-utils.types').isTimerButtonConfig
  export const isTimerControlError = import('./timer-controls-types').isTimerControlError
}

/**
 * Utility functions namespace
 */
export namespace TimerUtils {
  export const createDefaultButtonConfig = import('./timer-controls-utils.types').createDefaultButtonConfig
  export const createButtonConfigsForState = import('./timer-controls-utils.types').createButtonConfigsForState
  export const getAvailableActions = import('./timer-controls-utils.types').getAvailableActions
  export const isActionAvailable = import('./timer-controls-utils.types').isActionAvailable
  export const timerStateToControlState = import('./timer-controls-utils.types').timerStateToControlState
  export const parseShortcut = import('./timer-controls-utils.types').parseShortcut
  export const matchesShortcut = import('./timer-controls-utils.types').matchesShortcut
}