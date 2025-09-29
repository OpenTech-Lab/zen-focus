'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '../../src/components/ui/button'
import { cn } from '../../src/lib/utils'
import { TimerService, type TimerEvents } from '../../lib/services/timer-service'
import { type TimerState } from '../../lib/models/timer-state'

/**
 * Props interface for TimerControls component
 */
interface TimerControlsProps {
  /** Timer service instance for controlling timer state */
  timerService: TimerService
  /** Additional CSS classes */
  className?: string
  /** Size variant for buttons */
  size?: 'sm' | 'default' | 'lg'
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Show button labels alongside icons */
  showLabels?: boolean
}

/**
 * Custom hook for managing timer control state
 */
function useTimerControls(timerService: TimerService) {
  const [timerState, setTimerState] = useState<TimerState>(() => timerService.getCurrentState())
  const [isActive, setIsActive] = useState(() => timerService.isActive())
  const [isPaused, setIsPaused] = useState(() => timerService.isPaused())

  const updateState = useCallback(() => {
    const currentState = timerService.getCurrentState()
    const currentIsActive = timerService.isActive()
    const currentIsPaused = timerService.isPaused()

    setTimerState(currentState)
    setIsActive(currentIsActive)
    setIsPaused(currentIsPaused)
  }, [timerService])

  useEffect(() => {
    // Subscribe to all timer events for real-time state updates
    const eventHandlers: { [K in keyof TimerEvents]: (_data: TimerEvents[K]) => void } = {
      tick: updateState,
      start: updateState,
      pause: updateState,
      resume: updateState,
      reset: updateState,
      complete: updateState,
      phaseChange: updateState,
      cycleComplete: updateState,
    }

    // Subscribe to events
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      timerService.on(event as keyof TimerEvents, handler)
    })

    // Initial state update
    updateState()

    // Cleanup subscriptions
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        timerService.off(event as keyof TimerEvents, handler)
      })
    }
  }, [timerService, updateState])

  return { timerState, isActive, isPaused }
}

/**
 * TimerControls component - Control buttons for timer functionality
 *
 * Features:
 * - Start/Pause/Resume functionality with single button toggle
 * - Reset button with confirmation behavior
 * - Real-time state synchronization with TimerService
 * - Accessible button states and keyboard navigation
 * - Responsive design with size variants
 * - Icon-based interface with optional text labels
 * - Error handling for invalid timer operations
 * - Proper ARIA labels and screen reader support
 */
const TimerControls: React.FC<TimerControlsProps> = React.memo(
  ({
    timerService,
    className,
    size = 'default',
    orientation = 'horizontal',
    showLabels = false
  }) => {
    const { timerState, isActive, isPaused } = useTimerControls(timerService)
    const [isProcessing, setIsProcessing] = useState(false)
    const [announcement, setAnnouncement] = useState<string>('')

    // Determine primary button state and action
    const canStart = timerState.status === 'idle' || timerState.status === 'completed'
    const canPause = isActive && !isPaused
    const canResume = isPaused
    const canReset = timerState.status !== 'idle' || timerState.currentCycle > 1

    // Primary button configuration
    const primaryButtonConfig = {
      action: canStart ? 'start' : canPause ? 'pause' : 'resume',
      icon: canStart ? Play : canPause ? Pause : Play,
      label: canStart ? 'Start' : canPause ? 'Pause' : 'Resume',
      variant: canStart ? 'default' : canPause ? 'secondary' : 'default',
    } as const

    // Handle primary button click (start/pause/resume)
    const handlePrimaryAction = useCallback(async () => {
      if (isProcessing) return

      setIsProcessing(true)
      try {
        switch (primaryButtonConfig.action) {
          case 'start':
            timerService.start()
            setAnnouncement('Timer started')
            break
          case 'pause':
            timerService.pause()
            setAnnouncement('Timer paused')
            break
          case 'resume':
            timerService.resume()
            setAnnouncement('Timer resumed')
            break
        }
      } catch (error) {
        console.error(`Failed to ${primaryButtonConfig.action} timer:`, error)
        setAnnouncement(`Failed to ${primaryButtonConfig.action} timer`)
      } finally {
        setIsProcessing(false)
      }
    }, [timerService, primaryButtonConfig.action, isProcessing])

    // Handle reset button click
    const handleReset = useCallback(async () => {
      if (isProcessing) return

      setIsProcessing(true)
      try {
        timerService.reset()
        setAnnouncement('Timer reset')
      } catch (error) {
        console.error('Failed to reset timer:', error)
        setAnnouncement('Failed to reset timer')
      } finally {
        setIsProcessing(false)
      }
    }, [timerService, isProcessing])

    // Keyboard event handling for accessibility
    const handleKeyDown = useCallback((event: React.KeyboardEvent, action: () => void) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        action()
      }
    }, [])

    // Component CSS classes
    const containerClasses = cn(
      'timer-controls flex items-center justify-center gap-4',
      {
        'flex-row': orientation === 'horizontal',
        'flex-col': orientation === 'vertical',
        'gap-2': size === 'sm',
        'gap-4': size === 'default',
        'gap-6': size === 'lg',
      },
      className
    )

    const buttonClasses = cn(
      'transition-all duration-200 ease-in-out',
      'focus:ring-2 focus:ring-offset-2 focus:ring-primary',
      {
        'hover:scale-105 active:scale-95': !isProcessing,
        'opacity-50 cursor-not-allowed': isProcessing,
      }
    )

    const PrimaryIcon = primaryButtonConfig.icon
    const buttonSize = size

    return (
      <div role="group" aria-label="Timer controls" className={containerClasses}>
        {/* Primary Action Button (Start/Pause/Resume) */}
        <Button
          variant={primaryButtonConfig.variant as any}
          size={buttonSize}
          onClick={handlePrimaryAction}
          onKeyDown={(e) => handleKeyDown(e, handlePrimaryAction)}
          disabled={isProcessing}
          className={buttonClasses}
          aria-label={`${primaryButtonConfig.label} timer`}
          aria-pressed={isActive && !isPaused}
        >
          <PrimaryIcon
            className={cn(
              'transition-transform duration-200',
              {
                'w-4 h-4': size === 'sm',
                'w-5 h-5': size === 'default',
                'w-6 h-6': size === 'lg',
              }
            )}
          />
          {showLabels && (
            <span className="ml-2 font-medium">
              {primaryButtonConfig.label}
            </span>
          )}
        </Button>

        {/* Reset Button */}
        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleReset}
          onKeyDown={(e) => handleKeyDown(e, handleReset)}
          disabled={!canReset || isProcessing}
          className={cn(
            buttonClasses,
            {
              'opacity-50': !canReset,
            }
          )}
          aria-label="Reset timer"
        >
          <RotateCcw
            className={cn(
              'transition-transform duration-200',
              {
                'w-4 h-4': size === 'sm',
                'w-5 h-5': size === 'default',
                'w-6 h-6': size === 'lg',
                'rotate-180': isProcessing,
              }
            )}
          />
          {showLabels && (
            <span className="ml-2 font-medium">Reset</span>
          )}
        </Button>

        {/* Screen Reader Announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
      </div>
    )
  }
)

TimerControls.displayName = 'TimerControls'

export { TimerControls }
export type { TimerControlsProps }