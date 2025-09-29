/**
 * TypeScript interfaces and types for TimerControls component
 * Ensures type safety for timer state management and control functions
 */

import { type TimerService, type TimerEvents } from '../../lib/services/timer-service'
import { type TimerState, type SessionMode as SessionModeId } from '../../lib/models/timer-state'
import { type SessionMode } from '../../lib/models/session-mode'

/**
 * Timer control action types - these represent the available user actions
 */
export type TimerControlAction = 'start' | 'pause' | 'resume' | 'reset' | 'complete'

/**
 * Timer button configuration interface
 */
export interface TimerButtonConfig {
  /** Unique identifier for the button */
  id: TimerControlAction
  /** Display label for the button */
  label: string
  /** Icon identifier (matching your icon system) */
  icon: string
  /** Button variant for styling */
  variant: 'primary' | 'secondary' | 'danger' | 'success'
  /** Whether button is currently disabled */
  disabled: boolean
  /** Whether button should be visually prominent */
  emphasized?: boolean
  /** Accessibility label for screen readers */
  ariaLabel: string
  /** Keyboard shortcut (optional) */
  shortcut?: string
}

/**
 * Timer control state - derived from TimerService state
 */
export interface TimerControlState {
  /** Whether timer is currently active (running) */
  isActive: boolean
  /** Whether timer is currently paused */
  isPaused: boolean
  /** Whether timer can be started */
  canStart: boolean
  /** Whether timer can be paused */
  canPause: boolean
  /** Whether timer can be resumed */
  canResume: boolean
  /** Whether timer can be reset */
  canReset: boolean
  /** Whether timer can be completed manually */
  canComplete: boolean
  /** Current timer phase */
  phase: 'work' | 'break'
  /** Current session mode ID */
  sessionMode: SessionModeId
  /** Time remaining in seconds */
  timeRemaining: number
  /** Current cycle number */
  currentCycle: number
}

/**
 * Timer control callbacks - strongly typed event handlers
 */
export interface TimerControlCallbacks {
  /** Called when start button is pressed */
  onStart?: () => void | Promise<void>
  /** Called when pause button is pressed */
  onPause?: () => void | Promise<void>
  /** Called when resume button is pressed */
  onResume?: () => void | Promise<void>
  /** Called when reset button is pressed */
  onReset?: () => void | Promise<void>
  /** Called when complete button is pressed */
  onComplete?: () => void | Promise<void>
  /** Called when any control action results in an error */
  onError?: (error: Error, action: TimerControlAction) => void
  /** Called before any action is executed (can be used for confirmation) */
  onBeforeAction?: (action: TimerControlAction) => boolean | Promise<boolean>
  /** Called after any successful action */
  onAfterAction?: (action: TimerControlAction, newState: TimerControlState) => void
}

/**
 * Configuration options for timer controls behavior
 */
export interface TimerControlsConfig {
  /** Whether to show keyboard shortcuts */
  showShortcuts?: boolean
  /** Whether to show confirmation dialogs for destructive actions */
  confirmDestructiveActions?: boolean
  /** Whether to show tooltips on hover */
  showTooltips?: boolean
  /** Whether to enable sound feedback */
  enableSoundFeedback?: boolean
  /** Custom button configurations (overrides defaults) */
  customButtons?: Partial<Record<TimerControlAction, Partial<TimerButtonConfig>>>
  /** Actions to hide from the UI */
  hiddenActions?: TimerControlAction[]
  /** Whether controls should be disabled during transitions */
  disableDuringTransitions?: boolean
}

/**
 * Props interface for TimerControls component
 */
export interface TimerControlsProps {
  /** Timer service instance for state management and control operations */
  timerService: TimerService
  /** Callback functions for control actions */
  callbacks?: TimerControlCallbacks
  /** Configuration options for controls behavior */
  config?: TimerControlsConfig
  /** Additional CSS classes */
  className?: string
  /** Size variant for responsive design */
  size?: 'sm' | 'md' | 'lg'
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Whether controls should be compact (reduced spacing) */
  compact?: boolean
  /** Whether to show action labels alongside icons */
  showLabels?: boolean
  /** Custom theme overrides */
  theme?: TimerControlsTheme
}

/**
 * Theme configuration for timer controls
 */
export interface TimerControlsTheme {
  /** Colors for different button states */
  colors?: {
    primary?: string
    secondary?: string
    danger?: string
    success?: string
    disabled?: string
  }
  /** Border radius for buttons */
  borderRadius?: string
  /** Spacing between buttons */
  spacing?: string
  /** Button size configurations */
  sizes?: {
    sm?: { padding: string; fontSize: string }
    md?: { padding: string; fontSize: string }
    lg?: { padding: string; fontSize: string }
  }
}

/**
 * Hook return type for useTimerControls custom hook
 */
export interface UseTimerControlsReturn {
  /** Current timer control state */
  state: TimerControlState
  /** Available button configurations */
  buttons: TimerButtonConfig[]
  /** Execute a timer control action */
  executeAction: (action: TimerControlAction) => Promise<void>
  /** Whether any action is currently executing */
  isExecuting: boolean
  /** Last error that occurred */
  lastError: Error | null
  /** Clear the last error */
  clearError: () => void
}

/**
 * Timer control error types - extends base Error with additional context
 */
export class TimerControlError extends Error {
  constructor(
    message: string,
    public readonly action: TimerControlAction,
    public readonly timerState: TimerState,
    public readonly code: string = 'TIMER_CONTROL_ERROR'
  ) {
    super(message)
    this.name = 'TimerControlError'
  }
}

/**
 * Type guard to check if an error is a TimerControlError
 */
export function isTimerControlError(error: unknown): error is TimerControlError {
  return error instanceof TimerControlError
}

/**
 * Utility type for timer event handlers with proper typing
 */
export type TimerEventHandler<T extends keyof TimerEvents> = (data: TimerEvents[T]) => void

/**
 * Type for timer control action handlers - ensures proper error handling
 */
export type TimerActionHandler = () => void | Promise<void>

/**
 * Interface for timer controls accessibility features
 */
export interface TimerControlsA11y {
  /** Whether to announce state changes to screen readers */
  announceStateChanges?: boolean
  /** Whether to provide keyboard navigation support */
  enableKeyboardNavigation?: boolean
  /** Custom ARIA labels for different states */
  ariaLabels?: {
    controls?: string
    startButton?: string
    pauseButton?: string
    resumeButton?: string
    resetButton?: string
    completeButton?: string
  }
  /** Whether to show visual focus indicators */
  showFocusIndicators?: boolean
}

/**
 * Complete props interface including accessibility features
 */
export interface TimerControlsCompleteProps extends TimerControlsProps {
  /** Accessibility configuration */
  a11y?: TimerControlsA11y
}

/**
 * Default button configurations factory function type
 */
export type CreateDefaultButtonsFunction = (
  state: TimerControlState,
  config?: TimerControlsConfig
) => TimerButtonConfig[]

/**
 * Timer controls context type for React context (if using context pattern)
 */
export interface TimerControlsContext {
  timerService: TimerService
  state: TimerControlState
  executeAction: (action: TimerControlAction) => Promise<void>
  config: Required<TimerControlsConfig>
}

/**
 * Type for custom button render function
 */
export type CustomButtonRenderer = (
  button: TimerButtonConfig,
  executeAction: (action: TimerControlAction) => Promise<void>
) => React.ReactElement

/**
 * Advanced props interface with render prop patterns
 */
export interface TimerControlsAdvancedProps extends TimerControlsCompleteProps {
  /** Custom render function for buttons */
  renderButton?: CustomButtonRenderer
  /** Render prop for complete custom control layout */
  children?: (props: {
    state: TimerControlState
    buttons: TimerButtonConfig[]
    executeAction: (action: TimerControlAction) => Promise<void>
  }) => React.ReactElement
}
