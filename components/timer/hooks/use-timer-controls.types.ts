/**
 * TypeScript interfaces for useTimerControls hook
 * Provides type-safe integration with TimerService
 */

import { type TimerService, type TimerEvents, type TimerEventHandler } from '../../../lib/services/timer-service'
import { type TimerState } from '../../../lib/models/timer-state'
import { type SessionMode } from '../../../lib/models/session-mode'
import {
  type TimerControlAction,
  type TimerControlState,
  type TimerControlCallbacks,
  type TimerControlsConfig,
  type TimerButtonConfig,
  type TimerControlError
} from '../timer-controls-types'

/**
 * Hook configuration options
 */
export interface UseTimerControlsOptions {
  /** Timer service instance */
  timerService: TimerService
  /** Event callbacks */
  callbacks?: TimerControlCallbacks
  /** Control configuration */
  config?: TimerControlsConfig
  /** Whether to automatically sync with timer service events */
  autoSync?: boolean
  /** Debounce delay for rapid actions (in ms) */
  debounceDelay?: number
  /** Whether to enable optimistic updates */
  optimisticUpdates?: boolean
}

/**
 * Internal hook state interface
 */
export interface TimerControlsHookState {
  /** Current timer control state */
  controlState: TimerControlState
  /** Available button configurations */
  buttonConfigs: TimerButtonConfig[]
  /** Whether any action is currently executing */
  isExecuting: boolean
  /** Currently executing action (if any) */
  executingAction: TimerControlAction | null
  /** Last error that occurred */
  lastError: TimerControlError | null
  /** Loading states for individual actions */
  actionLoadingStates: Partial<Record<TimerControlAction, boolean>>
  /** Whether the component is mounted and listening to events */
  isListening: boolean
}

/**
 * Action execution context - passed to action handlers
 */
export interface ActionExecutionContext {
  /** Current timer state */
  timerState: Readonly<TimerState>
  /** Current session mode */
  sessionMode: Readonly<SessionMode> | null
  /** Action being executed */
  action: TimerControlAction
  /** Hook configuration */
  config: Required<TimerControlsConfig>
  /** Signal to check if operation should be cancelled */
  signal?: AbortSignal
}

/**
 * Action execution result
 */
export interface ActionExecutionResult {
  /** Whether the action was successful */
  success: boolean
  /** New timer state (if action was successful) */
  newState?: TimerControlState
  /** Error that occurred (if action failed) */
  error?: TimerControlError
  /** Whether the action was cancelled */
  cancelled?: boolean
}

/**
 * Action validation result
 */
export interface ActionValidationResult {
  /** Whether the action is valid */
  valid: boolean
  /** Reason why action is invalid (if not valid) */
  reason?: string
  /** Error code for invalid action */
  code?: string
}

/**
 * Hook event handlers - strongly typed for timer service events
 */
export interface TimerControlsEventHandlers {
  /** Handle timer tick events */
  onTick: TimerEventHandler<'tick'>
  /** Handle timer start events */
  onStart: TimerEventHandler<'start'>
  /** Handle timer pause events */
  onPause: TimerEventHandler<'pause'>
  /** Handle timer resume events */
  onResume: TimerEventHandler<'resume'>
  /** Handle timer reset events */
  onReset: TimerEventHandler<'reset'>
  /** Handle timer completion events */
  onComplete: TimerEventHandler<'complete'>
  /** Handle phase change events */
  onPhaseChange: TimerEventHandler<'phaseChange'>
  /** Handle cycle completion events */
  onCycleComplete: TimerEventHandler<'cycleComplete'>
}

/**
 * Button factory function type - creates button configs based on current state
 */
export type ButtonConfigFactory = (
  state: TimerControlState,
  config: Required<TimerControlsConfig>
) => TimerButtonConfig[]

/**
 * Action executor function type - handles executing timer actions
 */
export type ActionExecutor = (
  action: TimerControlAction,
  context: ActionExecutionContext
) => Promise<ActionExecutionResult>

/**
 * Action validator function type - validates if action can be executed
 */
export type ActionValidator = (
  action: TimerControlAction,
  context: Pick<ActionExecutionContext, 'timerState' | 'sessionMode'>
) => ActionValidationResult

/**
 * State synchronizer function type - syncs hook state with timer service
 */
export type StateSynchronizer = (timerService: TimerService) => TimerControlState

/**
 * Default configurations for the hook
 */
export interface DefaultTimerControlsConfig {
  /** Default button configurations */
  defaultButtons: Record<TimerControlAction, Omit<TimerButtonConfig, 'disabled'>>
  /** Default control config */
  defaultConfig: Required<TimerControlsConfig>
  /** Default debounce delay */
  defaultDebounceDelay: number
}

/**
 * Hook return interface - exported from useTimerControls
 */
export interface UseTimerControlsHookReturn {
  /** Current timer control state */
  state: TimerControlState
  /** Available button configurations */
  buttons: TimerButtonConfig[]
  /** Execute a timer control action */
  executeAction: (action: TimerControlAction) => Promise<void>
  /** Validate if an action can be executed */
  validateAction: (action: TimerControlAction) => ActionValidationResult
  /** Whether any action is currently executing */
  isExecuting: boolean
  /** Currently executing action (if any) */
  executingAction: TimerControlAction | null
  /** Loading state for specific action */
  isActionLoading: (action: TimerControlAction) => boolean
  /** Last error that occurred */
  lastError: TimerControlError | null
  /** Clear the last error */
  clearError: () => void
  /** Refresh state from timer service */
  refreshState: () => void
  /** Whether the hook is actively listening to timer events */
  isListening: boolean
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  /** Whether to automatically retry failed actions */
  autoRetry?: boolean
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Delay between retries (in ms) */
  retryDelay?: number
  /** Whether to log errors to console */
  logErrors?: boolean
  /** Custom error formatter */
  formatError?: (error: TimerControlError) => string
}

/**
 * Performance optimization configuration
 */
export interface PerformanceConfig {
  /** Whether to enable memo optimization for button configs */
  memoButtons?: boolean
  /** Whether to enable memo optimization for state */
  memoState?: boolean
  /** Whether to batch state updates */
  batchUpdates?: boolean
  /** Update frequency throttling (in ms) */
  updateThrottle?: number
}

/**
 * Advanced hook options extending base options
 */
export interface UseTimerControlsAdvancedOptions extends UseTimerControlsOptions {
  /** Error handling configuration */
  errorHandling?: ErrorHandlingConfig
  /** Performance optimization configuration */
  performance?: PerformanceConfig
  /** Custom button config factory */
  buttonFactory?: ButtonConfigFactory
  /** Custom action executor */
  actionExecutor?: ActionExecutor
  /** Custom action validator */
  actionValidator?: ActionValidator
  /** Custom state synchronizer */
  stateSynchronizer?: StateSynchronizer
}

/**
 * Hook lifecycle callbacks
 */
export interface TimerControlsLifecycleCallbacks {
  /** Called when hook is initialized */
  onInitialize?: (timerService: TimerService) => void
  /** Called when hook starts listening to events */
  onStartListening?: () => void
  /** Called when hook stops listening to events */
  onStopListening?: () => void
  /** Called before hook cleanup */
  onCleanup?: () => void
  /** Called when timer service changes */
  onTimerServiceChange?: (newService: TimerService, oldService: TimerService) => void
}

/**
 * Complete hook options with all configurations
 */
export interface UseTimerControlsCompleteOptions extends UseTimerControlsAdvancedOptions {
  /** Lifecycle callbacks */
  lifecycle?: TimerControlsLifecycleCallbacks
}

/**
 * Type for hook factory function (if using hook factory pattern)
 */
export type CreateTimerControlsHook = (
  defaultOptions?: Partial<UseTimerControlsCompleteOptions>
) => (options: UseTimerControlsOptions) => UseTimerControlsHookReturn

/**
 * Utility types for working with timer controls
 */
export namespace TimerControlsTypes {
  /** Extract action types that can be executed in current state */
  export type AvailableActions<T extends TimerControlState> =
    T['canStart'] extends true ? 'start' :
    T['canPause'] extends true ? 'pause' :
    T['canResume'] extends true ? 'resume' : never

  /** Extract button configs for available actions */
  export type AvailableButtons<T extends TimerControlAction[]> =
    Pick<Record<TimerControlAction, TimerButtonConfig>, T[number]>

  /** Type-safe event handler mapper */
  export type EventHandlerMap = {
    [K in keyof TimerEvents]: (event: K, handler: TimerEventHandler<K>) => void
  }
}