'use client'

import React from 'react'
import { SessionModeTabs } from './session-modes'
import { TimerDisplay } from './timer-display'
import { TimerControls } from './timer-controls'
import { getGlobalTimerService } from '../../lib/services/timer-service'
import { createDefaultSessionModes } from '../../lib/models/session-mode'

/**
 * Example component showing how to integrate SessionModeTabs with other timer components
 * This demonstrates the complete timer interface with session mode switching
 */
const SessionModeExample: React.FC = () => {
  const timerService = getGlobalTimerService()

  // Initialize with default study mode if not already initialized
  React.useEffect(() => {
    const currentMode = timerService.getSessionMode()
    if (!currentMode) {
      const defaultModes = createDefaultSessionModes()
      const studyMode = defaultModes.find((mode) => mode.id === 'study')
      if (studyMode) {
        timerService.initializeTimer('study', studyMode)
      }
    }
  }, [timerService])

  return (
    <div className='max-w-2xl mx-auto p-6 space-y-8'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>ZenFocus Timer</h1>
        <p className='text-gray-600 dark:text-gray-400'>
          Choose your session mode and focus with intention
        </p>
      </div>

      {/* Session Mode Selection */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>Session Modes</h2>
        <SessionModeTabs
          timerService={timerService}
          showDetails={true}
          allowSwitchWhenActive={false}
        />
      </div>

      {/* Timer Display */}
      <div className='flex justify-center'>
        <TimerDisplay timerService={timerService} size='lg' />
      </div>

      {/* Timer Controls */}
      <div className='flex justify-center'>
        <TimerControls timerService={timerService} size='lg' showLabels={true} />
      </div>

      {/* Usage Instructions */}
      <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400'>
        <h3 className='font-medium text-gray-800 dark:text-gray-200 mb-2'>How to use:</h3>
        <ul className='space-y-1 list-disc list-inside'>
          <li>Select a session mode from the tabs above</li>
          <li>Click Start to begin your focus session</li>
          <li>Use Pause/Resume to control the timer</li>
          <li>Reset to start over with the current mode</li>
          <li>Switch modes only when the timer is paused</li>
        </ul>
      </div>
    </div>
  )
}

export default SessionModeExample
