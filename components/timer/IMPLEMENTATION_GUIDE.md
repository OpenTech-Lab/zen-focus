# Timer Controls Component TypeScript Implementation Guide

This guide demonstrates how to implement a type-safe timer controls component using the provided TypeScript interfaces.

## Overview

The timer controls system provides comprehensive TypeScript support for:
- Timer control state management
- Button configuration and rendering
- Event handling and callbacks
- Error handling and validation
- Accessibility features
- Custom hooks integration

## Key Files

- `timer-controls-types.ts` - Core interfaces and types
- `hooks/use-timer-controls.types.ts` - Hook-specific types
- `timer-controls-utils.types.ts` - Utility types and helpers
- `index.types.ts` - Centralized exports

## Basic Component Implementation

```typescript
// timer-controls.tsx
import React from 'react'
import { Button } from '../ui/button'
import {
  type TimerControlsProps,
  type TimerControlAction,
  TimerUtils
} from './index.types'
import { useTimerControls } from './hooks/use-timer-controls'

export const TimerControls: React.FC<TimerControlsProps> = ({
  timerService,
  callbacks,
  config,
  className,
  size = 'md',
  orientation = 'horizontal'
}) => {
  const {
    state,
    buttons,
    executeAction,
    isExecuting,
    lastError,
    clearError
  } = useTimerControls({ timerService, callbacks, config })

  const handleAction = async (action: TimerControlAction) => {
    try {
      await executeAction(action)
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error)
    }
  }

  return (
    <div
      className={`timer-controls ${orientation} ${className}`}
      role="group"
      aria-label="Timer controls"
    >
      {buttons.map((button) => (
        <Button
          key={button.id}
          variant={button.variant}
          disabled={button.disabled || isExecuting}
          onClick={() => handleAction(button.id)}
          aria-label={button.ariaLabel}
          className={`timer-control-button size-${size}`}
        >
          {button.icon && <Icon name={button.icon} />}
          {config?.showLabels && <span>{button.label}</span>}
          {config?.showShortcuts && button.shortcut && (
            <kbd className="shortcut">{button.shortcut}</kbd>
          )}
        </Button>
      ))}

      {lastError && (
        <div role="alert" className="timer-error">
          {lastError.message}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
    </div>
  )
}
```

## Custom Hook Implementation

```typescript
// hooks/use-timer-controls.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  type UseTimerControlsOptions,
  type UseTimerControlsHookReturn,
  type TimerControlState,
  type TimerControlAction,
  TimerUtils
} from '../index.types'

export function useTimerControls(
  options: UseTimerControlsOptions
): UseTimerControlsHookReturn {
  const { timerService, callbacks, config, autoSync = true } = options

  // Internal state
  const [controlState, setControlState] = useState<TimerControlState>(() =>
    TimerUtils.timerStateToControlState(
      timerService.getCurrentState(),
      timerService.getSessionMode()
    )
  )

  const [isExecuting, setIsExecuting] = useState(false)
  const [lastError, setLastError] = useState<TimerControlError | null>(null)

  // Memoized button configurations
  const buttons = useMemo(() =>
    TimerUtils.createButtonConfigsForState(controlState, config),
    [controlState, config]
  )

  // Sync state with timer service
  const refreshState = useCallback(() => {
    const newState = TimerUtils.timerStateToControlState(
      timerService.getCurrentState(),
      timerService.getSessionMode()
    )
    setControlState(newState)
  }, [timerService])

  // Execute timer action
  const executeAction = useCallback(async (action: TimerControlAction) => {
    if (isExecuting) return

    // Validate action
    if (!TimerUtils.isActionAvailable(action, controlState)) {
      const error = new TimerControlError(
        `Action ${action} is not available in current state`,
        action,
        timerService.getCurrentState(),
        'ACTION_NOT_AVAILABLE'
      )
      setLastError(error)
      callbacks?.onError?.(error, action)
      return
    }

    // Execute pre-action callback
    const shouldProceed = await callbacks?.onBeforeAction?.(action)
    if (shouldProceed === false) return

    setIsExecuting(true)
    setLastError(null)

    try {
      // Execute the timer service action
      switch (action) {
        case 'start':
          timerService.start()
          break
        case 'pause':
          timerService.pause()
          break
        case 'resume':
          timerService.resume()
          break
        case 'reset':
          timerService.reset()
          break
        case 'complete':
          timerService.complete()
          break
      }

      // Refresh state and call post-action callback
      refreshState()
      callbacks?.onAfterAction?.(action, controlState)

      // Execute action-specific callback
      switch (action) {
        case 'start': callbacks?.onStart?.(); break
        case 'pause': callbacks?.onPause?.(); break
        case 'resume': callbacks?.onResume?.(); break
        case 'reset': callbacks?.onReset?.(); break
        case 'complete': callbacks?.onComplete?.(); break
      }

    } catch (error) {
      const controlError = error instanceof TimerControlError
        ? error
        : new TimerControlError(
            `Failed to execute ${action}: ${error.message}`,
            action,
            timerService.getCurrentState()
          )

      setLastError(controlError)
      callbacks?.onError?.(controlError, action)
    } finally {
      setIsExecuting(false)
    }
  }, [timerService, callbacks, controlState, isExecuting, refreshState])

  // Validate action availability
  const validateAction = useCallback((action: TimerControlAction) => ({
    valid: TimerUtils.isActionAvailable(action, controlState),
    reason: !TimerUtils.isActionAvailable(action, controlState)
      ? `Action ${action} is not available in current timer state`
      : undefined
  }), [controlState])

  // Set up event listeners
  useEffect(() => {
    if (!autoSync) return

    const updateState = () => refreshState()

    // Subscribe to all timer events
    timerService.on('tick', updateState)
    timerService.on('start', updateState)
    timerService.on('pause', updateState)
    timerService.on('resume', updateState)
    timerService.on('reset', updateState)
    timerService.on('complete', updateState)
    timerService.on('phaseChange', updateState)
    timerService.on('cycleComplete', updateState)

    return () => {
      // Cleanup event listeners
      timerService.off('tick', updateState)
      timerService.off('start', updateState)
      timerService.off('pause', updateState)
      timerService.off('resume', updateState)
      timerService.off('reset', updateState)
      timerService.off('complete', updateState)
      timerService.off('phaseChange', updateState)
      timerService.off('cycleComplete', updateState)
    }
  }, [timerService, autoSync, refreshState])

  return {
    state: controlState,
    buttons,
    executeAction,
    validateAction,
    isExecuting,
    executingAction: null, // Would track specific action if needed
    isActionLoading: () => false, // Would track per-action loading states
    lastError,
    clearError: () => setLastError(null),
    refreshState,
    isListening: autoSync
  }
}
```

## Advanced Usage Examples

### Custom Button Configurations

```typescript
const customConfig: TimerControlsConfig = {
  showShortcuts: true,
  confirmDestructiveActions: true,
  customButtons: {
    reset: {
      variant: 'danger',
      label: 'Reset Session',
      icon: 'refresh-ccw'
    }
  },
  hiddenActions: ['complete'] // Hide complete button
}

<TimerControls
  timerService={timerService}
  config={customConfig}
/>
```

### Error Handling

```typescript
const callbacks: TimerControlCallbacks = {
  onError: (error, action) => {
    console.error(`Timer ${action} failed:`, error.message)
    toast.error(`Failed to ${action} timer: ${error.message}`)
  },
  onBeforeAction: async (action) => {
    if (action === 'reset') {
      return await confirmDialog('Are you sure you want to reset?')
    }
    return true
  }
}

<TimerControls
  timerService={timerService}
  callbacks={callbacks}
/>
```

### Accessibility Features

```typescript
const a11yConfig: TimerControlsA11y = {
  announceStateChanges: true,
  enableKeyboardNavigation: true,
  ariaLabels: {
    controls: 'Timer control buttons',
    startButton: 'Start the timer session',
    pauseButton: 'Pause the current timer'
  }
}

<TimerControls
  timerService={timerService}
  a11y={a11yConfig}
/>
```

## Type Safety Benefits

1. **Compile-time validation**: All props and callbacks are type-checked
2. **IntelliSense support**: Full autocomplete for all configuration options
3. **Error prevention**: Invalid action calls caught at compile time
4. **Refactoring safety**: Changes to timer service interfaces are propagated
5. **Documentation**: Types serve as comprehensive API documentation

## Integration with Existing Timer Service

The types are designed to work seamlessly with your existing `TimerService`:

```typescript
import { getGlobalTimerService } from '../../lib/services/timer-service'
import { TimerControls } from './timer-controls'

// Get the existing timer service instance
const timerService = getGlobalTimerService()

// Initialize with a session mode
timerService.initializeTimer('study', studyModeConfig)

// Use with full type safety
<TimerControls
  timerService={timerService}
  size="lg"
  orientation="horizontal"
  showLabels={true}
/>
```

## Testing Support

The types also support comprehensive testing:

```typescript
// Type-safe test utilities
function createMockTimerService(): TimerService {
  // Mock implementation with correct types
}

function createTestState(
  overrides: Partial<TimerControlState>
): TimerControlState {
  return {
    isActive: false,
    isPaused: false,
    canStart: true,
    canPause: false,
    canResume: false,
    canReset: true,
    canComplete: false,
    phase: 'work',
    sessionMode: 'study',
    timeRemaining: 1500,
    currentCycle: 1,
    ...overrides
  }
}
```

This type system ensures robust, maintainable timer controls that integrate perfectly with your existing timer infrastructure while providing excellent developer experience and runtime safety.