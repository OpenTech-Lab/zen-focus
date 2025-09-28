'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '../../src/lib/utils'
import { TimerService, type TimerEvents } from '../../lib/services/timer-service'
import { type TimerState } from '../../lib/models/timer-state'
import { type SessionMode } from '../../lib/models/session-mode'

/**
 * Props interface for TimerDisplay component
 */
interface TimerDisplayProps {
  /** Timer service instance for real-time updates */
  timerService: TimerService
  /** Additional CSS classes */
  className?: string
  /** Size variant for responsive design */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Custom hook for managing timer state updates
 */
function useTimerState(timerService: TimerService) {
  const [timerState, setTimerState] = useState<TimerState>(() => timerService.getCurrentState())
  const [sessionMode, setSessionMode] = useState<SessionMode | null>(() =>
    timerService.getSessionMode()
  )

  const updateState = useCallback(() => {
    setTimerState(timerService.getCurrentState())
    setSessionMode(timerService.getSessionMode())
  }, [timerService])

  useEffect(() => {
    // Subscribe to all timer events for real-time updates
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

    // Cleanup subscriptions
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        timerService.off(event as keyof TimerEvents, handler)
      })
    }
  }, [timerService, updateState])

  return { timerState, sessionMode }
}

/**
 * Utility function to format time in MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Utility function to calculate progress percentage
 */
function calculateProgress(timeRemaining: number, totalDuration: number): number {
  if (totalDuration <= 0) return 100
  const elapsed = totalDuration - timeRemaining
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
}

/**
 * Progress ring component with SVG implementation
 */
interface ProgressRingProps {
  progress: number
  size: number
  strokeWidth: number
  color: string
  className?: string
}

const ProgressRing: React.FC<ProgressRingProps> = React.memo(
  ({ progress, size, strokeWidth, color, className }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <svg
        className={cn('transform -rotate-90', className)}
        width={size}
        height={size}
        role='progressbar'
        aria-label='Timer progress'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        {/* Background circle */}
        <circle
          className='opacity-20'
          stroke='currentColor'
          strokeWidth={strokeWidth}
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Progress circle */}
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.3s ease-in-out',
          }}
        />
      </svg>
    )
  }
)

ProgressRing.displayName = 'ProgressRing'

/**
 * TimerDisplay component - Main timer display with progress ring
 *
 * Features:
 * - Real-time timer updates via TimerService integration
 * - Circular progress ring visualization
 * - Time display in MM:SS format
 * - Session mode and phase indicators
 * - Responsive design for mobile and desktop
 * - Full accessibility support (ARIA labels, screen reader support)
 * - Theme-aware styling
 * - Performance optimized with React.memo and useCallback
 */
const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(
  ({ timerService, className, size = 'md' }) => {
    const { theme: _ } = useTheme()
    const { timerState, sessionMode } = useTimerState(timerService)
    const [announcement, setAnnouncement] = useState<string>('')

    // Calculate display values
    const isActive = timerService.isActive()
    const isPaused = timerService.isPaused()
    const timeDisplay = formatTime(timerState.timeRemaining)
    const phaseDisplay = timerState.phase === 'work' ? 'Work' : 'Break'
    const sessionModeDisplay = sessionMode?.name || 'Unknown'
    const cycleDisplay = `Cycle ${timerState.currentCycle}`

    // Calculate progress
    const totalDuration = useMemo(() => {
      if (!sessionMode) return 0
      return timerState.phase === 'work'
        ? sessionMode.defaultWorkDuration * 60
        : sessionMode.defaultBreakDuration * 60
    }, [sessionMode, timerState.phase])

    const progress = calculateProgress(timerState.timeRemaining, totalDuration)

    // Size configurations
    const sizeConfig = {
      sm: { ring: 200, stroke: 8, text: 'timer-sm' },
      md: { ring: 256, stroke: 12, text: 'timer' },
      lg: { ring: 320, stroke: 16, text: 'timer' },
    }

    const currentSize = sizeConfig[size]

    // Theme-aware colors
    const progressColor = sessionMode?.color || '#10b981'

    // Screen reader announcements for important state changes
    useEffect(() => {
      if (isActive) {
        setAnnouncement(`Timer started: ${timeDisplay} remaining in ${phaseDisplay} phase`)
      } else if (isPaused) {
        setAnnouncement(`Timer paused: ${timeDisplay} remaining`)
      }
    }, [isActive, isPaused, timeDisplay, phaseDisplay])

    // Component CSS classes
    const containerClasses = cn(
      'responsive-timer theme-adaptive',
      'flex flex-col items-center justify-center space-y-4',
      'p-6 rounded-3xl transition-all duration-300',
      {
        'timer-active animate-pulse-gentle': isActive,
        'timer-paused opacity-75': isPaused,
      },
      className
    )

    const ringClasses = cn('w-64 h-64 sm:w-80 sm:h-80', {
      'w-48 h-48 sm:w-56 sm:h-56': size === 'sm',
      'w-64 h-64 sm:w-80 sm:h-80': size === 'md',
      'w-80 h-80 sm:w-96 sm:h-96': size === 'lg',
    })

    const timeClasses = cn(
      'font-mono font-bold text-center',
      `text-${currentSize.text}`,
      'text-gray-900 dark:text-gray-100',
      'transition-colors duration-200'
    )

    const labelClasses = cn(
      'text-sm font-medium text-center',
      'text-gray-600 dark:text-gray-400',
      'transition-colors duration-200'
    )

    return (
      <div role='timer' aria-label='Timer display' tabIndex={0} className={containerClasses}>
        {/* Progress Ring Container */}
        <div className='relative flex items-center justify-center'>
          <ProgressRing
            progress={progress}
            size={currentSize.ring}
            strokeWidth={currentSize.stroke}
            color={progressColor}
            className={ringClasses}
          />

          {/* Time Display Overlay */}
          <div className='absolute inset-0 flex flex-col items-center justify-center space-y-2'>
            <div className={timeClasses}>{timeDisplay}</div>
            <div className={labelClasses}>{phaseDisplay}</div>
          </div>
        </div>

        {/* Session Info */}
        <div className='flex flex-col items-center space-y-1'>
          <div className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
            {sessionModeDisplay}
          </div>
          <div className={labelClasses}>{cycleDisplay}</div>
        </div>

        {/* Screen Reader Announcements */}
        <div role='status' aria-live='polite' aria-atomic='true' className='sr-only'>
          {announcement}
        </div>
      </div>
    )
  }
)

TimerDisplay.displayName = 'TimerDisplay'

export { TimerDisplay }
export type { TimerDisplayProps }
