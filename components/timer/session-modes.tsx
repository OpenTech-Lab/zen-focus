'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { BookOpen, Brain, Flower2, Circle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../src/components/ui/tabs'
import { Badge } from '../../src/components/ui/badge'
import { cn } from '../../src/lib/utils'
import { TimerService, type TimerEvents } from '../../lib/services/timer-service'
import {
  type SessionMode,
  createDefaultSessionModes,
  getSessionModeById,
} from '../../lib/models/session-mode'
import { type TimerState } from '../../lib/models/timer-state'

/**
 * Props interface for SessionModeTabs component
 */
interface SessionModeTabsProps {
  /** Timer service instance for mode switching */
  timerService: TimerService
  /** Additional CSS classes */
  className?: string
  /** Layout orientation for tabs */
  orientation?: 'horizontal' | 'vertical'
  /** Show detailed mode information */
  showDetails?: boolean
  /** Enable mode switching when timer is active */
  allowSwitchWhenActive?: boolean
}

/**
 * Icon mapping for session modes
 */
const SESSION_MODE_ICONS = {
  study: BookOpen,
  deepwork: Brain,
  yoga: Flower2,
  zen: Circle,
} as const

/**
 * Custom hook for managing session mode state and available modes
 */
function useSessionModes(timerService: TimerService) {
  const [currentMode, setCurrentMode] = useState<SessionMode | null>(() =>
    timerService.getSessionMode()
  )
  const [timerState, setTimerState] = useState<TimerState>(() => timerService.getCurrentState())
  const [availableModes] = useState<SessionMode[]>(() => createDefaultSessionModes())
  const [isActive, setIsActive] = useState(() => timerService.isActive())
  const [isPaused, setIsPaused] = useState(() => timerService.isPaused())

  const updateState = useCallback(() => {
    const newMode = timerService.getSessionMode()
    const newTimerState = timerService.getCurrentState()
    const newIsActive = timerService.isActive()
    const newIsPaused = timerService.isPaused()

    setCurrentMode(newMode)
    setTimerState(newTimerState)
    setIsActive(newIsActive)
    setIsPaused(newIsPaused)
  }, [timerService])

  useEffect(() => {
    // Subscribe to timer events for real-time updates
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

  return {
    currentMode,
    availableModes,
    timerState,
    isActive,
    isPaused,
  }
}

/**
 * Utility function to format duration for display
 */
function formatDuration(minutes: number): string {
  if (minutes === 0) return 'No break'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`
}

/**
 * Session mode information card component
 */
interface SessionModeInfoProps {
  mode: SessionMode
  isActive: boolean
  className?: string
}

const SessionModeInfo: React.FC<SessionModeInfoProps> = React.memo(
  ({ mode, isActive, className }) => {
    const Icon = SESSION_MODE_ICONS[mode.id as keyof typeof SESSION_MODE_ICONS] || Circle

    return (
      <div
        className={cn(
          'flex flex-col space-y-2 p-3 rounded-lg transition-all duration-200',
          {
            'bg-muted/50': !isActive,
            'bg-background border-2': isActive,
          },
          className
        )}
        style={{
          borderColor: isActive ? mode.color : 'transparent',
          backgroundColor: isActive ? `${mode.color}08` : undefined,
        }}
      >
        <div className='flex items-center space-x-2'>
          <Icon className='w-4 h-4' style={{ color: mode.color }} aria-hidden='true' />
          <span className='font-medium text-sm'>{mode.name}</span>
          {isActive && (
            <Badge variant='secondary' className='text-xs'>
              Active
            </Badge>
          )}
        </div>

        <p className='text-xs text-muted-foreground line-clamp-2'>{mode.description}</p>

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>Work: {formatDuration(mode.defaultWorkDuration)}</span>
          <span>Break: {formatDuration(mode.defaultBreakDuration)}</span>
        </div>

        {mode.isCustomizable && (
          <Badge variant='outline' className='text-xs w-fit'>
            Customizable
          </Badge>
        )}
      </div>
    )
  }
)

SessionModeInfo.displayName = 'SessionModeInfo'

/**
 * SessionModeTabs component - Tab interface for switching between session modes
 *
 * Features:
 * - Tab interface for all available session modes
 * - Visual indicators for active session mode
 * - Session mode information display with duration and description
 * - Integration with TimerService for mode switching
 * - Accessibility support with ARIA labels and keyboard navigation
 * - Responsive design for mobile and desktop
 * - Theme-aware styling with session mode colors
 * - Confirmation handling for mode switching during active timers
 */
const SessionModeTabs: React.FC<SessionModeTabsProps> = React.memo(
  ({
    timerService,
    className,
    orientation = 'horizontal',
    showDetails = true,
    allowSwitchWhenActive = false,
  }) => {
    const { currentMode, availableModes, timerState, isActive, isPaused } =
      useSessionModes(timerService)

    const [isProcessing, setIsProcessing] = useState(false)
    const [announcement, setAnnouncement] = useState<string>('')

    // Get current mode ID for tab value
    const currentModeId = currentMode?.id || 'study'

    // Determine if mode switching should be disabled
    const isSwitchingDisabled = isActive && !allowSwitchWhenActive && !isPaused

    // Handle mode switching
    const handleModeSwitch = useCallback(
      async (modeId: string) => {
        if (isProcessing || currentMode?.id === modeId) return

        // Check if switching is allowed
        if (isSwitchingDisabled) {
          setAnnouncement('Cannot switch modes while timer is running. Pause timer first.')
          return
        }

        const selectedMode = getSessionModeById(availableModes, modeId)
        if (!selectedMode) {
          setAnnouncement('Selected session mode not found')
          return
        }

        setIsProcessing(true)
        try {
          // Initialize timer with new session mode
          timerService.initializeTimer(selectedMode.id as any, selectedMode)
          setAnnouncement(`Switched to ${selectedMode.name} mode`)
        } catch (error) {
          console.error('Failed to switch session mode:', error)
          setAnnouncement(`Failed to switch to ${selectedMode.name} mode`)
        } finally {
          setIsProcessing(false)
        }
      },
      [timerService, currentMode, availableModes, isProcessing, isSwitchingDisabled]
    )

    // Get tab trigger classes
    const getTabTriggerClasses = useCallback(
      (mode: SessionMode, isCurrentMode: boolean) => {
        return cn(
          'flex items-center space-x-2 transition-all duration-200',
          'data-[state=active]:shadow-sm',
          {
            'opacity-50 cursor-not-allowed': isSwitchingDisabled && !isCurrentMode,
            'ring-2 ring-offset-2': isCurrentMode && isActive,
          }
        )
      },
      [isSwitchingDisabled, isActive]
    )

    // Get tab trigger style
    const getTabTriggerStyle = useCallback(
      (mode: SessionMode, isCurrentMode: boolean) => {
        if (!isCurrentMode) return {}

        return {
          '--tw-ring-color': mode.color,
          backgroundColor: isActive ? `${mode.color}10` : undefined,
          borderColor: isActive ? `${mode.color}40` : undefined,
        } as React.CSSProperties
      },
      [isActive]
    )

    // Component CSS classes
    const containerClasses = cn('session-mode-tabs space-y-4', className)

    const tabsListClasses = cn('grid w-full transition-all duration-200', {
      'grid-cols-2 sm:grid-cols-4': orientation === 'horizontal',
      'grid-cols-1 space-y-1': orientation === 'vertical',
    })

    return (
      <div className={containerClasses}>
        <Tabs
          value={currentModeId}
          onValueChange={handleModeSwitch}
          orientation={orientation}
          className='w-full'
        >
          <TabsList className={tabsListClasses}>
            {availableModes.map((mode) => {
              const Icon = SESSION_MODE_ICONS[mode.id as keyof typeof SESSION_MODE_ICONS] || Circle
              const isCurrentMode = mode.id === currentModeId

              return (
                <TabsTrigger
                  key={mode.id}
                  value={mode.id}
                  disabled={isProcessing || (isSwitchingDisabled && !isCurrentMode)}
                  className={getTabTriggerClasses(mode, isCurrentMode)}
                  style={getTabTriggerStyle(mode, isCurrentMode)}
                  aria-label={`Switch to ${mode.name} session mode`}
                >
                  <Icon
                    className='w-4 h-4'
                    style={{ color: isCurrentMode ? mode.color : undefined }}
                    aria-hidden='true'
                  />
                  <span className='text-sm font-medium'>{mode.name}</span>
                  {isCurrentMode && isActive && (
                    <div
                      className='w-2 h-2 rounded-full animate-pulse ml-1'
                      style={{ backgroundColor: mode.color }}
                      aria-label='Active session mode indicator'
                    />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Session mode details */}
          {showDetails && (
            <div className='mt-4 space-y-3'>
              {availableModes.map((mode) => (
                <TabsContent key={mode.id} value={mode.id} className='mt-0'>
                  <SessionModeInfo
                    mode={mode}
                    isActive={mode.id === currentModeId}
                    className='animate-in slide-in-from-bottom-2 duration-300'
                  />
                </TabsContent>
              ))}
            </div>
          )}
        </Tabs>

        {/* Status information */}
        {isSwitchingDisabled && (
          <div className='flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md'>
            <Circle className='w-4 h-4 fill-current' />
            <span>
              Timer is running.{' '}
              {allowSwitchWhenActive ? 'Switching will reset the timer.' : 'Pause to switch modes.'}
            </span>
          </div>
        )}

        {/* Screen Reader Announcements */}
        <div role='status' aria-live='polite' aria-atomic='true' className='sr-only'>
          {announcement}
        </div>
      </div>
    )
  }
)

SessionModeTabs.displayName = 'SessionModeTabs'

export { SessionModeTabs }
export type { SessionModeTabsProps }
