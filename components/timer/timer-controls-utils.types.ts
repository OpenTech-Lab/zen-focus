/**
 * Utility types and type guards for timer controls
 * Provides additional type safety and validation helpers
 */

import {
  type TimerControlAction,
  type TimerControlState,
  type TimerButtonConfig,
  type TimerControlsConfig,
  TimerControlError,
} from './timer-controls-types'
import { type TimerState, type SessionMode as SessionModeId } from '../../lib/models/timer-state'
import { type SessionMode } from '../../lib/models/session-mode'

/**
 * Utility type for conditional action availability
 */
export type ConditionalActions<T extends TimerControlState> = {
  start: T['canStart'] extends true ? 'start' : never
  pause: T['canPause'] extends true ? 'pause' : never
  resume: T['canResume'] extends true ? 'resume' : never
  reset: T['canReset'] extends true ? 'reset' : never
  complete: T['canComplete'] extends true ? 'complete' : never
}

/**
 * Extract available actions from timer state
 */
export type AvailableActionsFromState<T extends TimerControlState> =
  ConditionalActions<T>[keyof ConditionalActions<T>]

/**
 * Type guard for timer control actions
 */
export function isTimerControlAction(value: unknown): value is TimerControlAction {
  return (
    typeof value === 'string' && ['start', 'pause', 'resume', 'reset', 'complete'].includes(value)
  )
}

/**
 * Type guard for timer control state
 */
export function isTimerControlState(value: unknown): value is TimerControlState {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const state = value as Record<string, unknown>

  return (
    typeof state.isActive === 'boolean' &&
    typeof state.isPaused === 'boolean' &&
    typeof state.canStart === 'boolean' &&
    typeof state.canPause === 'boolean' &&
    typeof state.canResume === 'boolean' &&
    typeof state.canReset === 'boolean' &&
    typeof state.canComplete === 'boolean' &&
    (state.phase === 'work' || state.phase === 'break') &&
    typeof state.sessionMode === 'string' &&
    typeof state.timeRemaining === 'number' &&
    typeof state.currentCycle === 'number' &&
    state.timeRemaining >= 0 &&
    state.currentCycle >= 1
  )
}

/**
 * Type guard for timer button config
 */
export function isTimerButtonConfig(value: unknown): value is TimerButtonConfig {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const config = value as Record<string, unknown>

  return (
    isTimerControlAction(config.id) &&
    typeof config.label === 'string' &&
    typeof config.icon === 'string' &&
    ['primary', 'secondary', 'danger', 'success'].includes(config.variant as string) &&
    typeof config.disabled === 'boolean' &&
    typeof config.ariaLabel === 'string' &&
    (config.emphasized === undefined || typeof config.emphasized === 'boolean') &&
    (config.shortcut === undefined || typeof config.shortcut === 'string')
  )
}

/**
 * Utility type for extracting action-specific button configs
 */
export type ActionButtonConfig<T extends TimerControlAction> = TimerButtonConfig & {
  id: T
}

/**
 * Utility type for creating strongly-typed button config maps
 */
export type ButtonConfigMap = {
  [K in TimerControlAction]: ActionButtonConfig<K>
}

/**
 * Helper type for partial button config updates
 */
export type PartialButtonConfig<T extends TimerControlAction> = Partial<
  Omit<ActionButtonConfig<T>, 'id'>
> & { id: T }

/**
 * Utility function to create type-safe action validator
 */
export function createActionValidator<T extends TimerControlState>(
  state: T
): Record<TimerControlAction, boolean> {
  return {
    start: state.canStart,
    pause: state.canPause,
    resume: state.canResume,
    reset: state.canReset,
    complete: state.canComplete,
  }
}

/**
 * Utility function to filter available actions from state
 */
export function getAvailableActions(state: TimerControlState): TimerControlAction[] {
  const actions: TimerControlAction[] = []

  if (state.canStart) actions.push('start')
  if (state.canPause) actions.push('pause')
  if (state.canResume) actions.push('resume')
  if (state.canReset) actions.push('reset')
  if (state.canComplete) actions.push('complete')

  return actions
}

/**
 * Utility function to check if action is available in current state
 */
export function isActionAvailable(action: TimerControlAction, state: TimerControlState): boolean {
  switch (action) {
    case 'start':
      return state.canStart
    case 'pause':
      return state.canPause
    case 'resume':
      return state.canResume
    case 'reset':
      return state.canReset
    case 'complete':
      return state.canComplete
    default:
      return false
  }
}

/**
 * Convert TimerState to TimerControlState
 */
export function timerStateToControlState(
  timerState: TimerState,
  sessionMode: SessionMode | null
): TimerControlState {
  return {
    isActive: timerState.isActive,
    isPaused: timerState.isPaused,
    canStart: !timerState.isActive && timerState.timeRemaining > 0,
    canPause: timerState.isActive && !timerState.isPaused,
    canResume: timerState.isPaused,
    canReset: true, // Always allow reset
    canComplete: timerState.isActive && !timerState.isPaused,
    phase: timerState.phase,
    sessionMode: timerState.mode,
    timeRemaining: timerState.timeRemaining,
    currentCycle: timerState.currentCycle,
  }
}

/**
 * Type for action priority (used for UI ordering)
 */
export type ActionPriority = 'primary' | 'secondary' | 'tertiary'

/**
 * Action priority mapping
 */
export const ACTION_PRIORITIES: Record<TimerControlAction, ActionPriority> = {
  start: 'primary',
  pause: 'primary',
  resume: 'primary',
  reset: 'secondary',
  complete: 'tertiary',
}

/**
 * Get actions sorted by priority
 */
export function getActionsByPriority(
  actions: TimerControlAction[]
): Record<ActionPriority, TimerControlAction[]> {
  const result: Record<ActionPriority, TimerControlAction[]> = {
    primary: [],
    secondary: [],
    tertiary: [],
  }

  actions.forEach((action) => {
    const priority = ACTION_PRIORITIES[action]
    result[priority].push(action)
  })

  return result
}

/**
 * Default button configuration factory
 */
export function createDefaultButtonConfig(
  action: TimerControlAction,
  disabled: boolean = false
): TimerButtonConfig {
  const configs: Record<TimerControlAction, Omit<TimerButtonConfig, 'disabled'>> = {
    start: {
      id: 'start',
      label: 'Start',
      icon: 'play',
      variant: 'primary',
      ariaLabel: 'Start timer',
      emphasized: true,
      shortcut: 'Space',
    },
    pause: {
      id: 'pause',
      label: 'Pause',
      icon: 'pause',
      variant: 'secondary',
      ariaLabel: 'Pause timer',
      emphasized: true,
      shortcut: 'Space',
    },
    resume: {
      id: 'resume',
      label: 'Resume',
      icon: 'play',
      variant: 'primary',
      ariaLabel: 'Resume timer',
      emphasized: true,
      shortcut: 'Space',
    },
    reset: {
      id: 'reset',
      label: 'Reset',
      icon: 'refresh',
      variant: 'secondary',
      ariaLabel: 'Reset timer',
      shortcut: 'R',
    },
    complete: {
      id: 'complete',
      label: 'Complete',
      icon: 'check',
      variant: 'success',
      ariaLabel: 'Complete timer phase',
      shortcut: 'Enter',
    },
  }

  return {
    ...configs[action],
    disabled,
  }
}

/**
 * Create button configs for current state
 */
export function createButtonConfigsForState(
  state: TimerControlState,
  config?: TimerControlsConfig
): TimerButtonConfig[] {
  const availableActions = getAvailableActions(state)
  const hiddenActions = config?.hiddenActions || []
  const visibleActions = availableActions.filter((action) => !hiddenActions.includes(action))

  return visibleActions.map((action) => {
    const defaultConfig = createDefaultButtonConfig(action, false)
    const customConfig = config?.customButtons?.[action]

    return customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig
  })
}

/**
 * Validate button configuration
 */
export function validateButtonConfig(config: unknown): config is TimerButtonConfig {
  return isTimerButtonConfig(config)
}

/**
 * Create error with proper typing
 */
export function createTimerControlError(
  message: string,
  action: TimerControlAction,
  timerState: TimerState,
  code?: string
): TimerControlError {
  return new TimerControlError(message, action, timerState, code)
}

/**
 * Type-safe error handler creator
 */
export function createErrorHandler<T extends TimerControlAction>(
  action: T,
  onError?: (error: TimerControlError, action: T) => void
) {
  return (error: TimerControlError) => {
    if (error.action === action && onError) {
      onError(error, action)
    }
  }
}

/**
 * Utility type for theme-aware button variants
 */
export type ThemeAwareVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | `${string}-${string}` // Allow custom theme variants

/**
 * Extend button config with theme-aware variants
 */
export interface ThemeAwareButtonConfig extends Omit<TimerButtonConfig, 'variant'> {
  variant: ThemeAwareVariant
}

/**
 * Type for keyboard shortcut handling
 */
export interface ShortcutConfig {
  key: string
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  preventDefault?: boolean
  stopPropagation?: boolean
}

/**
 * Enhanced button config with shortcut handling
 */
export interface EnhancedButtonConfig extends TimerButtonConfig {
  shortcutConfig?: ShortcutConfig
}

/**
 * Utility function to parse shortcut string into config
 */
export function parseShortcut(shortcut: string): ShortcutConfig | null {
  if (!shortcut) return null

  const parts = shortcut.toLowerCase().split('+')
  const key = parts.pop()
  if (!key) return null

  const modifiers = parts.filter((part) =>
    ['ctrl', 'shift', 'alt', 'meta'].includes(part)
  ) as ShortcutConfig['modifiers']

  return {
    key: key === 'space' ? ' ' : key,
    modifiers: modifiers.length > 0 ? modifiers : undefined,
  }
}

/**
 * Check if shortcut matches keyboard event
 */
export function matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
  if (event.key.toLowerCase() !== config.key.toLowerCase()) {
    return false
  }

  const modifiers = config.modifiers || []
  return (
    event.ctrlKey === modifiers.includes('ctrl') &&
    event.shiftKey === modifiers.includes('shift') &&
    event.altKey === modifiers.includes('alt') &&
    event.metaKey === modifiers.includes('meta')
  )
}
