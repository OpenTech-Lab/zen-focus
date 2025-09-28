import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

/**
 * Integration test for guest timer session flow
 *
 * This test validates the complete guest user experience following Scenario 1 from quickstart.md:
 * "First-Time Guest User Experience" - validates basic timer functionality without authentication.
 *
 * This is an INTEGRATION test - testing multiple components working together:
 * - Timer service integration with persistence service
 * - Session service integration with timer state
 * - Guest session persistence using localStorage
 * - Timer operations across page refresh
 * - Complete session workflow: start → pause → resume → complete
 * - Session mode integration and timer behavior
 * - Break transitions and session completion
 *
 * Key Integration Points Tested:
 * - Timer engine + persistence service + session tracking
 * - Guest user state management across components
 * - Session mode configuration + timer behavior
 * - Page refresh persistence + session restoration
 * - Complete workflow integration from UI to data layer
 */

describe('Guest Timer Session Flow - Integration Test', () => {
  const TIMER_STATE_ENDPOINT = '/api/timer/state'
  const SESSION_MODES_ENDPOINT = '/api/session-modes'
  const SESSIONS_ENDPOINT = '/api/sessions'

  // Test timer state data for different scenarios
  const studyModeTimerState = {
    isActive: true,
    isPaused: false,
    mode: 'study',
    phase: 'work',
    timeRemaining: 1500, // 25 minutes in seconds
    totalElapsed: 0,
    currentCycle: 1,
  }

  const pausedStudyTimerState = {
    isActive: true,
    isPaused: true,
    mode: 'study',
    phase: 'work',
    timeRemaining: 1470, // 24:30 remaining after 30 seconds
    totalElapsed: 30,
    currentCycle: 1,
  }

  const completedWorkPhaseState = {
    isActive: true,
    isPaused: false,
    mode: 'study',
    phase: 'break',
    timeRemaining: 300, // 5 minutes break
    totalElapsed: 1500, // 25 minutes work completed
    currentCycle: 1,
  }

  const deepWorkModeTimerState = {
    isActive: true,
    isPaused: false,
    mode: 'deepwork',
    phase: 'work',
    timeRemaining: 3000, // 50 minutes in seconds
    totalElapsed: 0,
    currentCycle: 1,
  }

  const zenModeTimerState = {
    isActive: true,
    isPaused: false,
    mode: 'zen',
    phase: 'work',
    timeRemaining: 0, // Open-ended timing
    totalElapsed: 0,
    currentCycle: 1,
  }

  beforeEach(async () => {
    // Clear any existing timer state before each test
    await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Clear localStorage for clean guest state
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  afterEach(async () => {
    // Clean up timer state after each test
    await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  describe('Complete Guest Timer Session Workflow', () => {
    it('should complete full guest timer session: start → pause → resume → complete', async () => {
      // Step 1: Verify no active timer initially (guest user starts clean)
      const initialStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(initialStateResponse.status).toBe(404) // No active timer initially

      // Step 2: Start Study Mode session (25:00 default Pomodoro)
      const startSessionResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(startSessionResponse.status).toBe(200)

      const startedSession = await startSessionResponse.json()
      expect(startedSession).toMatchObject({
        isActive: true,
        isPaused: false,
        mode: 'study',
        phase: 'work',
        timeRemaining: 1500,
        totalElapsed: 0,
        currentCycle: 1,
      })

      // Step 3: Verify timer is running and retrievable
      const runningStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(runningStateResponse.status).toBe(200)

      const runningState = await runningStateResponse.json()
      expect(runningState.isActive).toBe(true)
      expect(runningState.isPaused).toBe(false)
      expect(runningState.mode).toBe('study')

      // Step 4: Pause timer after 30 seconds of running
      const pauseSessionResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pausedStudyTimerState),
      })
      expect(pauseSessionResponse.status).toBe(200)

      const pausedSession = await pauseSessionResponse.json()
      expect(pausedSession).toMatchObject({
        isActive: true,
        isPaused: true,
        mode: 'study',
        phase: 'work',
        timeRemaining: 1470, // 30 seconds elapsed
        totalElapsed: 30,
        currentCycle: 1,
      })

      // Step 5: Verify paused state is maintained
      const pausedStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(pausedStateResponse.status).toBe(200)

      const pausedState = await pausedStateResponse.json()
      expect(pausedState.isPaused).toBe(true)
      expect(pausedState.timeRemaining).toBe(1470)

      // Step 6: Resume timer (unpause)
      const resumeSessionResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pausedStudyTimerState,
          isPaused: false, // Resume timer
        }),
      })
      expect(resumeSessionResponse.status).toBe(200)

      const resumedSession = await resumeSessionResponse.json()
      expect(resumedSession.isPaused).toBe(false)
      expect(resumedSession.isActive).toBe(true)

      // Step 7: Complete work phase and transition to break
      const completeWorkResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completedWorkPhaseState),
      })
      expect(completeWorkResponse.status).toBe(200)

      const breakPhase = await completeWorkResponse.json()
      expect(breakPhase).toMatchObject({
        isActive: true,
        isPaused: false,
        mode: 'study',
        phase: 'break',
        timeRemaining: 300, // 5 minutes break
        totalElapsed: 1500, // 25 minutes work completed
        currentCycle: 1,
      })

      // Step 8: Verify break phase is active
      const breakStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(breakStateResponse.status).toBe(200)

      const breakState = await breakStateResponse.json()
      expect(breakState.phase).toBe('break')
      expect(breakState.timeRemaining).toBe(300)
    })

    it('should persist guest timer state through page refresh', async () => {
      // Step 1: Start a timer session
      const startSessionResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(startSessionResponse.status).toBe(200)

      // Step 2: Verify session is saved and retrievable
      const savedStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(savedStateResponse.status).toBe(200)

      const savedState = await savedStateResponse.json()
      expect(savedState.mode).toBe('study')
      expect(savedState.isActive).toBe(true)

      // Step 3: Simulate page refresh by getting state again (persistence test)
      const persistedStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(persistedStateResponse.status).toBe(200)

      const persistedState = await persistedStateResponse.json()

      // Verify state persistence across "page refresh"
      expect(persistedState).toMatchObject({
        isActive: true,
        mode: 'study',
        phase: 'work',
        currentCycle: 1,
      })

      // Step 4: Continue from persisted state (pause and verify consistency)
      const updatedTimerState = {
        ...persistedState,
        isPaused: true,
        timeRemaining: persistedState.timeRemaining - 60, // 1 minute elapsed
        totalElapsed: persistedState.totalElapsed + 60,
      }

      const updateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTimerState),
      })
      expect(updateResponse.status).toBe(200)

      const updatedState = await updateResponse.json()
      expect(updatedState.isPaused).toBe(true)
      expect(updatedState.totalElapsed).toBe(60)
    })
  })

  describe('Session Mode Integration and Timer Behavior', () => {
    it('should handle Study Mode (Pomodoro) with correct intervals', async () => {
      // Verify Study Mode default configuration
      const studySessionResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(studySessionResponse.status).toBe(200)

      const studySession = await studySessionResponse.json()

      // Study mode should default to 25:00 work / 5:00 break (Pomodoro)
      expect(studySession.mode).toBe('study')
      expect(studySession.timeRemaining).toBe(1500) // 25 minutes
      expect(studySession.phase).toBe('work')

      // Simulate work completion and break transition
      const breakTransitionResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completedWorkPhaseState),
      })
      expect(breakTransitionResponse.status).toBe(200)

      const breakSession = await breakTransitionResponse.json()
      expect(breakSession.phase).toBe('break')
      expect(breakSession.timeRemaining).toBe(300) // 5 minutes break
    })

    it('should handle Deep Work Mode with longer intervals', async () => {
      // Verify Deep Work Mode configuration
      const deepWorkResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deepWorkModeTimerState),
      })
      expect(deepWorkResponse.status).toBe(200)

      const deepWorkSession = await deepWorkResponse.json()

      // Deep Work mode should default to 50:00 work intervals
      expect(deepWorkSession.mode).toBe('deepwork')
      expect(deepWorkSession.timeRemaining).toBe(3000) // 50 minutes
      expect(deepWorkSession.phase).toBe('work')

      // Verify the longer interval is properly configured
      expect(deepWorkSession.timeRemaining).toBeGreaterThan(studyModeTimerState.timeRemaining)
    })

    it('should handle Zen Mode with open-ended timing', async () => {
      // Verify Zen Mode configuration (open-ended)
      const zenResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(zenModeTimerState),
      })
      expect(zenResponse.status).toBe(200)

      const zenSession = await zenResponse.json()

      // Zen mode should allow open-ended timing
      expect(zenSession.mode).toBe('zen')
      expect(zenSession.timeRemaining).toBe(0) // Open-ended
      expect(zenSession.phase).toBe('work')

      // Simulate manual stop in Zen mode
      const stopZenResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...zenModeTimerState,
          isActive: false,
          totalElapsed: 1800, // 30 minutes of meditation
        }),
      })
      expect(stopZenResponse.status).toBe(200)

      const stoppedZen = await stopZenResponse.json()
      expect(stoppedZen.isActive).toBe(false)
      expect(stoppedZen.totalElapsed).toBe(1800)
    })

    it('should allow switching between session modes', async () => {
      // Start with Study Mode
      const studyResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(studyResponse.status).toBe(200)

      // Switch to Deep Work Mode
      const deepWorkResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deepWorkModeTimerState),
      })
      expect(deepWorkResponse.status).toBe(200)

      const deepWorkSession = await deepWorkResponse.json()
      expect(deepWorkSession.mode).toBe('deepwork')
      expect(deepWorkSession.timeRemaining).toBe(3000)

      // Switch to Zen Mode
      const zenResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(zenModeTimerState),
      })
      expect(zenResponse.status).toBe(200)

      const zenSession = await zenResponse.json()
      expect(zenSession.mode).toBe('zen')
      expect(zenSession.timeRemaining).toBe(0)
    })
  })

  describe('Guest Session Scenarios and Edge Cases', () => {
    it('should handle session completion without authentication', async () => {
      // Start and complete a full session as guest
      const startResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(startResponse.status).toBe(200)

      // Complete the session
      const completeResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false,
          isPaused: false,
          mode: 'study',
          phase: 'work',
          timeRemaining: 0,
          totalElapsed: 1500, // Completed 25 minutes
          currentCycle: 1,
        }),
      })
      expect(completeResponse.status).toBe(200)

      const completedSession = await completeResponse.json()
      expect(completedSession.isActive).toBe(false)
      expect(completedSession.totalElapsed).toBe(1500)

      // Verify session can be cleared after completion
      const clearResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(clearResponse.status).toBe(204)
    })

    it('should handle interrupted guest sessions', async () => {
      // Start a session
      const startResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(startResponse.status).toBe(200)

      // Simulate interruption by clearing timer state
      const interruptResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(interruptResponse.status).toBe(204)

      // Verify no active session after interruption
      const checkStateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(checkStateResponse.status).toBe(404)

      // Should be able to start new session after interruption
      const newSessionResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deepWorkModeTimerState),
      })
      expect(newSessionResponse.status).toBe(200)

      const newSession = await newSessionResponse.json()
      expect(newSession.mode).toBe('deepwork')
    })

    it('should handle multiple cycle progression for guest users', async () => {
      // Start first cycle
      const cycle1Response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(cycle1Response.status).toBe(200)

      // Complete work phase and start break
      const breakResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completedWorkPhaseState),
      })
      expect(breakResponse.status).toBe(200)

      // Complete break and start second cycle
      const cycle2Response = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true,
          isPaused: false,
          mode: 'study',
          phase: 'work',
          timeRemaining: 1500, // New work session
          totalElapsed: 0, // Reset for new cycle
          currentCycle: 2, // Second cycle
        }),
      })
      expect(cycle2Response.status).toBe(200)

      const cycle2Session = await cycle2Response.json()
      expect(cycle2Session.currentCycle).toBe(2)
      expect(cycle2Session.phase).toBe('work')
      expect(cycle2Session.timeRemaining).toBe(1500)
    })
  })

  describe('Timer State Validation and Data Integrity', () => {
    it('should validate timer state transitions maintain data integrity', async () => {
      // Start with valid initial state
      const startResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(startResponse.status).toBe(200)

      // Ensure progressive time updates are consistent
      const progressUpdates = [
        { timeRemaining: 1440, totalElapsed: 60 }, // 1 minute elapsed
        { timeRemaining: 1380, totalElapsed: 120 }, // 2 minutes elapsed
        { timeRemaining: 1320, totalElapsed: 180 }, // 3 minutes elapsed
      ]

      for (const update of progressUpdates) {
        const updateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...studyModeTimerState,
            timeRemaining: update.timeRemaining,
            totalElapsed: update.totalElapsed,
          }),
        })
        expect(updateResponse.status).toBe(200)

        const updatedState = await updateResponse.json()
        expect(updatedState.timeRemaining).toBe(update.timeRemaining)
        expect(updatedState.totalElapsed).toBe(update.totalElapsed)

        // Verify time consistency: timeRemaining + totalElapsed should equal original duration
        expect(updatedState.timeRemaining + updatedState.totalElapsed).toBe(1500)
      }
    })

    it('should reject invalid timer state data', async () => {
      // Test invalid mode
      const invalidModeResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...studyModeTimerState,
          mode: 'invalid-mode',
        }),
      })
      expect(invalidModeResponse.status).toBe(400)

      // Test negative time values
      const negativeTimeResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...studyModeTimerState,
          timeRemaining: -1,
        }),
      })
      expect(negativeTimeResponse.status).toBe(400)

      // Test invalid cycle number
      const invalidCycleResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...studyModeTimerState,
          currentCycle: 0,
        }),
      })
      expect(invalidCycleResponse.status).toBe(400)
    })
  })

  describe('Guest Session Integration with Services', () => {
    it('should integrate timer state with session tracking for guests', async () => {
      // This integration test verifies that timer state management
      // properly integrates with session tracking services for guest users

      // Start a timer session
      const timerResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyModeTimerState),
      })
      expect(timerResponse.status).toBe(200)

      // Verify timer state is accessible
      const stateResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(stateResponse.status).toBe(200)

      const timerState = await stateResponse.json()

      // Integration point: Timer state should be compatible with session creation
      // (This would normally involve creating a session record, but for guests
      // it might only be stored temporarily)
      expect(timerState.mode).toBe('study')
      expect(timerState.isActive).toBe(true)
      expect(timerState.currentCycle).toBeGreaterThanOrEqual(1)

      // Complete the session and verify state transition
      const completeResponse = await fetch(`http://localhost:3000${TIMER_STATE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...timerState,
          isActive: false,
          timeRemaining: 0,
          totalElapsed: 1500,
        }),
      })
      expect(completeResponse.status).toBe(200)

      const completedState = await completeResponse.json()
      expect(completedState.isActive).toBe(false)
      expect(completedState.totalElapsed).toBe(1500)
    })
  })
})
